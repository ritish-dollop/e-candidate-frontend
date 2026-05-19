import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Campaign } from '../../../../../../../customer-portal/models/Campaign.model';
import { CampaignService } from '../../../../../../../customer-portal/services/campaign.service';
import { LeadService } from '../../../../../../../customer-portal/services/lead.service';
import { CustomerService } from '../../../../../../services/Customer/Customer.service';
import { CustomerRoomComponent } from '../../../../../customer-room/customer-room.component';
import { UserResponse } from '../../../../../../interfaces/user-request';
import { AuthService } from '../../../../../../../auth/services/auth.service';
 

@Component({
  selector: 'app-list-campaigns',
  imports: [CommonModule,FormsModule,RouterLink,CustomerRoomComponent],
  templateUrl: './list-campaigns.component.html',
  styleUrl: './list-campaigns.component.css'
})
export class ListCampaignsComponent {
  campaigns: Campaign[] = [];
  loading = true;
  errorMessage = '';
  currentView:number = 1;
  customerId!: number;
  page = 0;
  size = 8;
  totalPages = 0;


  searchText: string = '';


  showCreateCampaignPopup = false;

  newCampaign = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  customerId: null as any,
  status:'PENDING'

};

// 🔹 summary counts
  activeCampaignCount = 0;
  totalLeadsCount = 0;
  allCampaigns: Campaign[] = [];

  // 🔹 tabs
  currentTab: 'CAMPAIGNS' | 'CUSTOMERS' | 'BRANCHES' | 'USERS' = 'CAMPAIGNS';
  customerName!: string;
  customerLogo!: string;



   campaignStatuses: string[] = [
    'ALL',
    'PENDING',
    'ACTIVE',
    'INACTIVE',
  ];

  selectedStatus: string = 'ALL';


  constructor(private campaignService: CampaignService, private router:Router,
    private route:ActivatedRoute, private leadService:LeadService,
     private customerService:CustomerService,private location:Location,private auth : AuthService
  ) {}

  ngOnInit(): void {
    const nav = history.state;
   this.loadUser()
    if (nav?.customerName) {
      this.customerName = nav.customerName;
      this.customerLogo = nav.customerLogo || 'assets/images/svg-img/E.svg';
    }

   this.route.paramMap.subscribe(params => {
    const id = params.get('customerId');
    console.log('Route param customerId =', id);

    this.customerId = Number(id);

    if (this.customerId > 0) {
      this.fetchCampaignsByCustomer(this.customerId);
    } else {
      this.errorMessage = 'Customer not found';
      this.loading = false;
    }
  });
}

 ngAfterViewInit(): void {

    let Buttons = document.querySelectorAll(".selectSection button");

    for (let button of Buttons) {

      button.addEventListener('click', (e: any) => {

        const et = e.target;

        const active = document.querySelector("ss");
        // (same as your JS script — you had no logic here)

        et.classList.add("active");

        this.currentView = Number(button.getAttribute('data-number'));

        let allContent = document.querySelectorAll('.content');

        for (let content of allContent) {

          if (content.getAttribute('data-number') === button.getAttribute('data-number')) {
            (content as HTMLElement).style.display = "none";
          }
          else {
            (content as HTMLElement).style.display = "block";
          }
        }
      });
    }
  }
  currentUser! : UserResponse;
  loadUser() {
    this.auth.getCurrentUser().subscribe({
      next: (res: UserResponse) => {
        console.log(res);
        this.currentUser = res;
      },
      error: (err) => {

        if (err.status === 401) {
          // this.error = "Session expired. Please login again.";
          console.log('Session expired. Please login again.');
        } else {
          console.log('Unable to load profile.');
        }
        console.log(err);
        this.router.navigate(['/auth/login']);
      },
    });
  }
  filterByStatus(status: string) {
    this.selectedStatus = status;

    if (status === 'ALL') {
      this.campaigns = this.allCampaigns;
    } else {
      this.campaigns = this.allCampaigns.filter(
        c => c.status?.toUpperCase() === status
      );
    }
  }

  onCampaignClick(campaign: Campaign): void {
  if (campaign.status?.toUpperCase() !== 'ACTIVE') {
    Swal.fire({
      icon: 'info',
      title: 'Campaign not active',
      text: 'You can open leads only for active campaigns'
    });
    return;
  }

  this.openLeadsDetails(campaign.id, campaign.name);
}


  changeStatus(campaign: Campaign, status: 'ACTIVE' |'INACTIVE' | 'DELETED') {

  Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to mark this campaign as ${status}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
  }).then(result => {

    if (!result.isConfirmed) return;

    this.campaignService
      .changeCampaignStatus(campaign.id, status)
      .subscribe({

        next: () => {
          campaign.status = status;

          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: `Campaign marked as ${status}`,
            timer: 1500,
            showConfirmButton: false
          });

          this.calculateActiveCampaigns();
        },

        error: () => {
          Swal.fire('Failed to update status');
        }
      });

  });
}

  resetFilters(): void {
  this.selectedStatus = 'ALL';
  this.searchText = '';

  this.campaigns = [...this.allCampaigns];
  }

  isCampaignExpired(campaign: any): boolean {
  if (!campaign.endDate) return false;

  const today = new Date();
  const endDate = new Date(campaign.endDate);

  endDate.setHours(23, 59, 59, 999);

  return endDate < today;
}

getCampaignStatusClass(campaign: any): string {
  if (
    campaign.status === 'ACTIVE' &&
    !this.isCampaignExpired(campaign)
  ) {
    return 'status-active';
  }

  return 'status-deactive';
}

  fetchCampaignsByCustomer(customerId: number): void {

    this.loading = true;
    this.totalLeadsCount = 0;

    this.campaignService
      .getCampaignsByCustomerPaginated(customerId, this.page, this.size)
      .subscribe({

        next: (res) => {

          // 🔥 pagination response handle
          this.campaigns = res.content;
          this.allCampaigns = res.content;
          this.totalPages = res.totalPages;

          // 🔁 rest logic bilkul same
          this.campaigns.forEach(c => {
            c.totalLeads = 0;
            c.unaddressedCount = 0;
            c.overdueCount = 0;
            c.lastLeadDate = null;

            // ================= TOTAL LEADS =================
            this.leadService.getLeadsByCampaign(c.id).subscribe(leads => {
              c.totalLeads = leads.length;

              this.totalLeadsCount += leads.length;
              leads.forEach(l => {
                const d = new Date(l.updatedAt || l.createdAt);
                if (!c.lastLeadDate || d > new Date(c.lastLeadDate)) {
                  c.lastLeadDate = d.toISOString();
                }
              });
            });

            // ================= NEW / UNADDRESSED =================
            this.leadService
              .filterLeadsByStatus(c.id, 'UNADDRESSED')
              .subscribe(leads => {
                c.unaddressedCount = leads.length;
              });

            // ================= OVERDUE =================
            this.leadService
              .getOverdueLeads(c.id)
              .subscribe(leads => {
                c.overdueCount = leads.length;
              });
          });

          this.calculateActiveCampaigns();
          this.loading = false;
        },

        error: () => {
          this.errorMessage = 'Failed to load campaigns';
          this.loading = false;
        }
      });
  }
   goToPage(p: number) {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.fetchCampaignsByCustomer(this.customerId);
  }


  nextPage() {
    this.goToPage(this.page + 1);
  }

  prevPage() {
    this.goToPage(this.page - 1);
  }


  /* ================= SUMMARY CALCULATIONS ================= */

  private calculateActiveCampaigns() {
    this.activeCampaignCount = this.campaigns.filter(
      c => c.status?.toUpperCase() === 'ACTIVE'
    ).length;
  }

  private calculateTotalLeads() {
    this.totalLeadsCount = 0;

    this.campaigns.forEach(campaign => {
      this.leadService.countTotalLeads(campaign.id).subscribe({
        next: count => {
          this.totalLeadsCount += count;
        },
        error: () => {}
      });
    });
  }

  /* ================= TABS ================= */

  setTab(tab: 'CAMPAIGNS' | 'CUSTOMERS' | 'BRANCHES' | 'USERS') {
    this.currentTab = tab;
  }



openLeadsDetails(campaignId: number, campaignName: string): void {
  console.log('Opening leads for campaign:', campaignId, campaignName);

 this.router.navigate(['/agency/campaigns/leads', campaignId], {
    state: {
      campaignId: campaignId,
      campaignName: campaignName
    }
  });
}

handleClick(campaign: Campaign) {
  if (campaign.status?.toUpperCase() !== 'ACTIVE') {
    return;
  }
  this.openLeadsDetails(campaign.id, campaign.name);
}



  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'pending_status';
      case 'ACTIVE': return 'active_status';
      case 'INACTIVE': return 'inactive_status';
      case 'IN_PROGRESS': return 'inprogress_status';
      default: return 'unknown_status';
    }
  }

  /* ================= POPUP HANDLERS ================= */
  openCreateCampaignPopup() {
    this.newCampaign = {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      customerId: this.customerId,
      status: 'PENDING'
    };
    this.showCreateCampaignPopup = true;
  }

  closeCreateCampaignPopup() {
    this.showCreateCampaignPopup = false;
  }

  /* ================= CREATE ================= */
    formErrors: any = {};
  saveCampaign() {

    if (!this.newCampaign.name.trim()) {
      return;
    }

    this.newCampaign.customerId = this.customerId;

    if (!this.customerId || this.customerId <= 0) {
      Swal.fire('Customer ID missing. Please reload page.');
      return;
    }


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.newCampaign.startDate) {
      const startDate = new Date(this.newCampaign.startDate);
      startDate.setHours(0, 0, 0, 0);

      if (startDate.getTime() < today.getTime()) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Start Date',
      text: 'Start date can be today or a future date',
      position: 'top',
      showCloseButton: true,
      confirmButtonText: 'OK'
    });
    return;
  }
    }

    if (this.newCampaign.startDate && this.newCampaign.endDate) {
      const startDate = new Date(this.newCampaign.startDate);
      const endDate = new Date(this.newCampaign.endDate);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < startDate) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid End Date',
          text: 'End date cannot be before start date',
          position: 'top',
          showCloseButton: true,
          confirmButtonText: 'OK'
        });

        return;
      }
    }

    if (this.newCampaign.startDate) {
      this.newCampaign.startDate =
        this.newCampaign.startDate + 'T00:00:00';
    }

    if (this.newCampaign.endDate) {
      this.newCampaign.endDate =
        this.newCampaign.endDate + 'T23:59:59';
    }

    this.loading = true;
    this.formErrors = {}; // ✅ clear old backend errors

    this.campaignService.createCampaign(this.newCampaign).subscribe({
      next: () => {

        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Campaign Created 🎉',
          text: 'Campaign created successfully',
          timer: 2000,
          showConfirmButton: false
        });

        this.showCreateCampaignPopup = false;
        this.closeModalSafely();
        this.fetchCampaignsByCustomer(this.customerId);

      },
      error: (err) => {

        this.loading = false;

        if (err.status === 400 && err.error) {
          this.formErrors = err.error;
          return;
        }

        Swal.fire('Campaign creation failed');
      }
    });
  }

  testClick() {
  console.log('Create Campaign button clicked');
}

  goBack() {
    this.location.back();
  }

  closeModalSafely() {
  const modalEl = document.getElementById('addCampaign');

  if (!modalEl) return;

  const modalInstance =
    (window as any).bootstrap.Modal.getInstance(modalEl) ||
    new (window as any).bootstrap.Modal(modalEl);

  modalInstance.hide();
  }

    onSearch(): void {
    if (!this.searchText || this.searchText.trim() === '') {
      this.fetchCampaignsByCustomer(this.customerId);
      return;
    }

    this.loading = true;

    this.campaignService.searchCampaigns(this.searchText).subscribe({
      next: (data) => {
        this.campaigns = data.filter(
          c => c.customerId === this.customerId
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading = false;
      }
    });
  }
}
