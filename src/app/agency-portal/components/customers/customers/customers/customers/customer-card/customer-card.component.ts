import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import { Router, RouterLink } from '@angular/router';
import { CustomerResponse } from '../../../../../../interfaces/customer';
import { AuthService } from '../../../../../../../auth/services/auth.service';
import { CampaignService } from '../../../../../../../customer-portal/services/campaign.service';
import { LeadService } from '../../../../../../../customer-portal/services/lead.service';
import { Agency } from '../../../../../../interfaces/agency';
import { AgencyService } from '../../../../../../services/agency-service/services.service';
import { CloudinaryService } from '../../../../../../services/chat-service/cloudnary.service';
import { CustomerService } from '../../../../../../services/Customer/Customer.service';

@Component({
  selector: 'app-customer-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-card.component.html',
  styleUrls: ['./customer-card.component.css'],
})
export class CustomerCardComponent implements OnInit {
  dropdownOpen = false;
  customers: CustomerResponse[] = [];
  filtered: CustomerResponse[] = [];

  search: string = '';
  selectedAgency: number = 0;

  agencies: { id: number; name: string }[] = [];

  showAddPage = false;
  activeTab: 'company' | 'admin' = 'company';
  currentView: number = 1;
  roles: string[] = [];

  page = 0;
  size = 6;
  totalPages = 0;
  campaignCountMap: Record<number, number> = {};
  leadCountMap: Record<number, number> = {};
  pendingCampaignCountMap: Record<number, number> = {};
  newLeadCountMap: Record<number, number> = {};
  lastUpdatedMap: Record<number, string | null> = {};
  newLeadCount = 0;

  company: any = {
    companyName: '',
    companyLogo: '',
    contactNo: '',
    billingEmail: '',
    managedBy: '',
    registrationNumber: '',
    billingAddress: '',
    status: 'ACTIVE',
    agencyId: null,
  };

  companyLogoFile: File | null = null;
  companyLogoPreview: string | null = null;
  @ViewChild('companyLogoInput') companyLogoInput!: ElementRef;

  admin: any = {
    adminName: '',
    contactNo: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  adminPhotoFile: File | null = null;
  adminPhotoPreview: string | null = null;
  @ViewChild('adminPhotoInput') adminPhotoInput!: ElementRef;

  constructor(
    private cusotmerService: CustomerService,
    private agencyApi: AgencyService,
    private cloudService: CloudinaryService,
    private router: Router,
    private leadService: LeadService,
    private campaignService: CampaignService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.roles = this.authService.getUserRoles();
    this.selectedAgency = 0;
    this.loadCustomers();
    this.loadAgencies();
  }

  openAdd() {
    this.router.navigate(['/agency/customer/add']);
  }

  cancelAdd() {
    this.router.navigate(['/agency/customer/card']);
  }

  isAgencyAdmin(): boolean {
    return this.roles.includes('AGENCY_ADMIN');
  }

  /** 🔐 Only Agency Super Admin */
  isAgencySuperAdmin(): boolean {
    return this.roles.includes('AGENCY_SUPER_ADMIN');
  }

  loadAgencies() {
    this.agencyApi.getAllAgencie().subscribe((res: Agency[]) => {
      this.agencies = res.map((a) => ({
        id: a.id!,
        name: a.agencyName,
      }));
    });
  }

  loadCustomers() {
    if (this.selectedAgency === 0) {
      this.cusotmerService
        .getAllPaginated(this.page, this.size)
        .subscribe((res) => {
          this.customers = res.content;
          this.totalPages = res.totalPages;
          this.applyFilter();
          this.loadCustomerStats();
        });
    }
  }

  loadCustomerStats() {
    this.customers.forEach((customer) => {
      this.leadCountMap[customer.id] = 0;
      this.newLeadCountMap[customer.id] = 0;
      this.lastUpdatedMap[customer.id] = null;

      this.campaignService
        .getCampaignsByCustomer(customer.id)
        .subscribe((campaigns) => {
          const pendingCampaigns = campaigns.filter(
            (c) => c.status === 'PENDING'
          );
          this.pendingCampaignCountMap[customer.id] = pendingCampaigns.length;

          const activeCampaigns = campaigns.filter(
            (c) => c.status === 'ACTIVE'
          );
          this.campaignCountMap[customer.id] = activeCampaigns.length;

          if (campaigns.length === 0) {
            return;
          }

          let completedCampaigns = 0;

          campaigns.forEach((campaign) => {
            this.leadService
              .getLeadsByCampaign(campaign.id)
              .subscribe((allLeads) => {
                this.leadCountMap[customer.id] += allLeads.length;

                allLeads.forEach((l) => {
                  const d = new Date(l.updatedAt || l.createdAt);
                  const prev = this.lastUpdatedMap[customer.id];
                  if (!prev || d > new Date(prev)) {
                    this.lastUpdatedMap[customer.id] = d.toISOString();
                  }
                });
              });

            this.leadService
              .filterLeadsByStatus(campaign.id, 'UNADDRESSED')
              .subscribe((newLeads) => {
                this.newLeadCountMap[customer.id] += newLeads.length;
              });

            completedCampaigns++;
          });
        });
    });
  }

  selectAgency(id: number) {
    this.selectedAgency = id;
    this.dropdownOpen = false;
    this.page = 0;
    this.loadCustomers();
  }

  goToPage(p: number) {
    if (p < 0 || p >= this.totalPages) return;
    this.page = p;
    this.loadCustomers();
  }

  nextPage() {
    this.goToPage(this.page + 1);
  }

  prevPage() {
    this.goToPage(this.page - 1);
  }

  applyFilter() {
    this.filtered = this.customers.filter(
      (c) =>
        !this.search ||
        c.companyName.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  openEdit(c: CustomerResponse) {}

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  getSelectedAgencyName() {
    const agency = this.agencies.find((a) => a.id === this.selectedAgency);
    return agency ? agency.name : 'Filter By Agency';
  }

  ngAfterViewInit(): void {
    let Buttons = document.querySelectorAll('.selectSection button');

    for (let button of Buttons) {
      button.addEventListener('click', (e: any) => {
        const et = e.target;

        const active = document.querySelector('ss');

        et.classList.add('active');

        this.currentView = Number(button.getAttribute('data-number'));

        let allContent = document.querySelectorAll('.content');

        for (let content of allContent) {
          if (
            content.getAttribute('data-number') ===
            button.getAttribute('data-number')
          ) {
            (content as HTMLElement).style.display = 'none';
          } else {
            (content as HTMLElement).style.display = 'block';
          }
        }
      });
    }
  }

  openCustomerCampaigns(customer: CustomerResponse) {
    this.router.navigate(['/agency/campaigns', customer.id], {
      state: {
        customerName: customer.companyName,
        customerLogo: customer.companyLogo,
      },
    });
  }

  changeCustomerStatus(c: CustomerResponse) {
    const nextStatus = c.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark this customer as ${nextStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.cusotmerService.toggleCustomerStatus(c.id).subscribe({
        next: (res) => {
          c.status = res.status;

          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: `Customer marked as ${res.status}`,
            timer: 1500,
            showConfirmButton: false,
          });
        },

        error: () => {
          Swal.fire('Failed to update customer status');
        },
      });
    });
  }
}
