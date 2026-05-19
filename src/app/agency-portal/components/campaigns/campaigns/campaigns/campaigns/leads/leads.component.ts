import { CommonModule, Location } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../../../../../auth/services/auth.service';
import { LeadsDetailsComponent } from '../../../../../../../customer-portal/campaigns/components/leads-details/leads-details.component';
import { Lead } from '../../../../../../../customer-portal/models/Lead.model';
import { LeadService } from '../../../../../../../customer-portal/services/lead.service';
import { SocketService } from '../../../../../../../socket-services/socket.service';
import { UserResponse } from '../../../../../../interfaces/user-request';

declare var bootstrap: any;

@Component({
  selector: 'app-leads',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.css',
})
export class LeadsComponent implements OnInit, AfterViewInit {
  campaignName = 'E-candidate';

  totalLeads = 0;
  lastLeadDate: string | null = null;
  lastUpdated: string | null = null;

  campaignId!: number;
  // campaignName: string = '';
  leads: Lead[] = [];
  filteredLeads: any[] = [];
  loading: boolean = true;
  cvRequestLeads: any[] = [];
  unprocessedLeads: any[] = [];
  inContactLeads: any[] = [];
  interviewLeads: any[] = [];
  hiredLeads: any[] = [];
  rejectedLeads: any[] = [];
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = 0;
  originalLeads: Lead[] = [];
  currentView: number = 1;
  @ViewChild('profileInput') profileInput: any;
  @ViewChild('resumeInput') resumeInput: any;
  @ViewChild('leadForm') leadForm!: NgForm;

  lead: any = {
    applicantName: '',
    email: '',
    contactNo: '',
    scorecardScore: '',
    status: 'UNADDRESSED',
    appliedDate: '',
    updatedDate: '',
    nextTaskDate: '',
    commentCount: 0,
    lastEditDate: '',
    customerDocumentName: '',
  };
  resumeFile: File | null = null;
  profileImage: File | null = null;
  allLeads: any[] = [];
  profileError: string | null = null;
  resumeError: string | null = null;

  roles: string[] = [];

  constructor(
    private leadService: LeadService,
    private route: ActivatedRoute,
    private location: Location,
    private auth: AuthService,
    private socket: SocketService
  ) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    const state = history.state;
     this.loadUser();
    if (state && state.campaignId) {
      this.campaignId = state.campaignId;
      localStorage.setItem('campaignId', this.campaignId.toString());
    }
    if (!this.campaignId) {
      const storedId = localStorage.getItem('campaignId');
      if (storedId) {
        this.campaignId = Number(storedId);
      }
    }

    if (state?.campaignId) {
      this.campaignName = state.campaignName; // ✅ dynamic
      this.loadTopSummary(state.campaignId);
    }

    if (state && state.campaignName) {
      this.campaignName = state.campaignName;
      localStorage.setItem('campaignName', this.campaignName);
    } else {
      this.campaignName = localStorage.getItem('campaignName') || '';
    }
    if (this.campaignId) {
      this.loadLeads();
    }

    this.leadService.abcCall$.subscribe(() => {
      if (this.campaignId) {
        console.log('service');
        this.loadLeads();
      }
    });

    this.socket.updateLead$.subscribe((data) => {
      console.log('Component A received', data);
      if (this.campaignId) {
        this.loadLeads();
      }
    });
  }

  loadTopSummary(campaignId: number) {
    // 🔹 Total leads (COUNT API)
    this.leadService.countTotalLeads(campaignId).subscribe({
      next: (count) => {
        this.totalLeads = count;
      },
    });

    // 🔹 Last lead & last updated
    this.leadService.getLeadsByCampaign(campaignId).subscribe({
      next: (leads) => {
        if (leads.length > 0) {
          const latestLead = leads.reduce((a: any, b: any) =>
            new Date(b.createdAt) > new Date(a.createdAt) ? b : a
          );

          this.lastLeadDate = latestLead.createdAt;
          this.lastUpdated = latestLead.updatedAt || latestLead.lastEditDate;
        } else {
          this.lastLeadDate = null;
          this.lastUpdated = null;
        }
      },
      error: () => {
        this.lastLeadDate = null;
        this.lastUpdated = null;
      },
    });
  }

  isAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }
  ngAfterViewInit(): void {
    let Buttons = document.querySelectorAll('.selectSection button');

    for (let button of Buttons) {
      button.addEventListener('click', (e: any) => {
        const et = e.target;

        const active = document.querySelector('ss');
        // (same as your JS script — you had no logic here)

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

    currentUser!:UserResponse;
    loadUser() {
      this.auth.getCurrentUser().subscribe({
        next: (res: UserResponse) => {
          console.log(res);
          this.currentUser = res;
          // if (!this.socket.isConnected) {
            this.socket.connect(res.email);
          // }

        }

      });
    }

  loadLeads() {
    // all leads with pagination---------------------------------
    this.leadService
      .getLeadsByCampaignPaged(this.campaignId, this.currentPage, this.pageSize)
      .subscribe({
        next: (res) => {
          console.log('RAW BACKEND RESPONSE:', res.content);
          this.leads = res.content.map((l: any) => {
            return {
              ...l,
              commentCount: Number(l.commentCount ?? 0), // 🔥 FORCE NUMBER
            };
          });
          this.filteredLeads = [...this.leads];
          this.totalPages = res.totalPages;
          this.loading = false;
        },
        error: (err) => console.error('Paged Error:', err),
      });
    // all leads with kanban ---------------------------------
    this.leadService.getLeadsByCampaign(this.campaignId).subscribe({
      next: (full) => {
        console.log('RAW KANBAN RESPONSE:', full);

        this.allLeads = full.map((l: any) => ({
          ...l,
          commentCount: Number(l.commentCount ?? 0),
        }));

        // Kanban buckets with FULL DATA
        this.cvRequestLeads = this.allLeads.filter(
          (l) => l.status === 'CV_REQUEST'
        );
        this.unprocessedLeads = this.allLeads.filter(
          (l) => l.status === 'UNADDRESSED'
        );
        this.inContactLeads = this.allLeads.filter(
          (l) => l.status === 'IN_CONTACT'
        );
        this.interviewLeads = this.allLeads.filter(
          (l) => l.status === 'INTERVIEW'
        );
        this.hiredLeads = this.allLeads.filter((l) => l.status === 'HIRED');
        this.rejectedLeads = this.allLeads.filter(
          (l) => l.status === 'REJECTED'
        );
      },
      error: (err) => console.error('Full Error:', err),
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLeads();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLeads();
    }
  }
  // ----------------------STATUS-----------------------

  isFilterApplied = false;
  currentFilterStatus: string | null = null;

  updateLeadStatus(leadId: number, newStatus: string): void {
    this.leadService.changeLeadStatus(leadId, newStatus).subscribe({
      next: () => {
        // this.leadService.updateLeadsCall();
        this.socket.emit('updateLead', {
          leadId: leadId,
          status: newStatus,
        });

        const now = new Date().toISOString();

        // 1️⃣ Update FULL LIST (Kanban)
        const target = this.allLeads.find((l) => l.id === leadId);
        if (target) {
          target.status = newStatus;
          target.updatedDate = now;
          target.lastEditDate = now;
        }
        const targetPage = this.leads.find((l) => l.id === leadId);
        if (targetPage) {
          targetPage.status = newStatus;
          targetPage.updatedDate = now;
          targetPage.lastEditDate = now;
        }

        // 3️⃣ Update FILTERED list (if active)
        const targetFilter = this.filteredLeads.find((l) => l.id === leadId);
        if (targetFilter) {
          targetFilter.status = newStatus;
          targetFilter.updatedDate = now;
          targetFilter.lastEditDate = now;
        }

        // 2️⃣ Recalculate Kanban buckets from FULL LIST
        this.cvRequestLeads = this.allLeads.filter(
          (l) => l.status === 'CV_REQUEST'
        );
        this.unprocessedLeads = this.allLeads.filter(
          (l) => l.status === 'UNADDRESSED'
        );
        this.inContactLeads = this.allLeads.filter(
          (l) => l.status === 'IN_CONTACT'
        );
        this.interviewLeads = this.allLeads.filter(
          (l) => l.status === 'INTERVIEW'
        );
        this.hiredLeads = this.allLeads.filter((l) => l.status === 'HIRED');
        this.rejectedLeads = this.allLeads.filter(
          (l) => l.status === 'REJECTED'
        );

        // 3️⃣ Table pagination list untouched
      },
      error: () => alert('Failed to update status'),
    });
  }

  getLeadsByStatus(status: string) {
    if (!this.filteredLeads) return [];
    return this.filteredLeads.filter((l) => l.status === status);
  }

  onSearch(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredLeads = this.leads.filter((lead) =>
      lead.applicantName.toLowerCase().includes(value)
    );
  }

  getStatusClass(status: string): string {
    if (!status) return '';

    const map: any = {
      UNADDRESSED: 'Unprocessed',
      IN_CONTACT: 'InContact',
      NOT_REACHED_PROCESSED: 'NotReached',
      CV_REQUEST: 'CVRequest',
      INTERVIEW: 'Interview',
      REJECTION: 'Rejection',
      HIRED: 'Hired',
    };
    return map[status] || 'Unknown';
  }

  filterByStatus(status: string) {
    this.currentFilterStatus = status;
    this.isFilterApplied = true;
    this.currentPage = 0;

    // 🔴 OVERDUE = special case
    if (status === 'OVERDUE') {
      this.leadService.getOverdueLeads(this.campaignId).subscribe({
        next: (res: any[]) => {
          this.filteredLeads = res.map((l) => ({
            ...l,
            commentCount: l.commentCount ?? 0,
          }));
          this.leads = this.filteredLeads;
          this.totalPages = 1;
        },
        error: (err) => {
          console.error('Overdue fetch failed', err);
        },
      });
      return;
    }

    // 🟢 NORMAL STATUS
    this.leadService.filterLeadsByStatus(this.campaignId, status).subscribe({
      next: (res: any[]) => {
        this.filteredLeads = res.map((l) => ({
          ...l,
          commentCount: l.commentCount ?? 0,
        }));
        this.leads = this.filteredLeads;
        this.totalPages = 1;
      },
      error: (err) => {
        console.error('Status filter failed', err);
      },
    });
  }

  resetFilter() {
    this.currentFilterStatus = null;
    this.isFilterApplied = false;

    this.currentPage = 0;
    this.loadLeads();

    this.leadService.getLeadsByCampaign(this.campaignId).subscribe({
      next: (full) => {
        this.allLeads = full;

        this.cvRequestLeads = this.allLeads.filter(
          (l) => l.status === 'CV_REQUEST'
        );
        this.unprocessedLeads = this.allLeads.filter(
          (l) => l.status === 'UNADDRESSED'
        );
        this.inContactLeads = this.allLeads.filter(
          (l) => l.status === 'IN_CONTACT'
        );
        this.interviewLeads = this.allLeads.filter(
          (l) => l.status === 'INTERVIEW'
        );
        this.hiredLeads = this.allLeads.filter((l) => l.status === 'HIRED');
        this.rejectedLeads = this.allLeads.filter(
          (l) => l.status === 'REJECTED'
        );
      },
    });
  }

  // ------------------------EXPORT CSV--------------------------
  exportCsv() {
    if (this.isFilterApplied && this.currentFilterStatus) {
      // Filtered list directly export
      const csvContent = this.convertToCsv(this.filteredLeads);

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${this.campaignId}-leads-filtered-${this.currentFilterStatus}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // No filter → backend full list export
      this.leadService.exportLeadsToCsv(this.campaignId).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');

          a.href = url;
          a.download = `campaign-${this.campaignId}-leads.csv`;
          a.click();

          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Export CSV Error:', err);
        },
      });
    }
  }
  private convertToCsv(data: any[]): string {
    if (!data || data.length === 0) return '';

    const header = Object.keys(data[0]).join(',');

    const rows = data.map((obj) =>
      Object.values(obj)
        .map((value) => `"${value ?? ''}"`)
        .join(',')
    );

    return [header, ...rows].join('\n');
  }

  // --------------------DRAG & DROP----------------------
  onDragStart(event: DragEvent, leadId: number) {
    console.log('🔥 Drag Start:', leadId);
    if (event.dataTransfer) {
      event.dataTransfer.setData('leadId', leadId.toString());
    }
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
    console.log('🟡 Drag Over');
  }

  onDrop(event: DragEvent, newStatus: string) {
    event.preventDefault();

    const leadId = Number(event.dataTransfer?.getData('leadId'));
    console.log('Drop:', leadId, '=>', newStatus);

    if (!leadId) {
      return;
    }
    this.updateLeadStatus(leadId, newStatus);
  }

  // ----------------------------- FILE SELECT EVENTS -----------------------------
  onProfileSelect(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
      ];

      if (!allowedTypes.includes(file.type)) {
        this.profileError = 'Only PNG, JPG, JPEG, WEBP, GIF allowed!';
        this.profileImage = null;
        event.target.value = '';
        return;
      }

      this.profileError = null;
      this.profileImage = file;
    }
  }

  onResumeSelect(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        this.resumeError = 'Only PDF / DOC / DOCX allowed!';
        this.resumeFile = null;
        event.target.value = '';
        return;
      }

      this.resumeError = null;
      this.resumeFile = file;
    }
  }
  goBack() {
    this.location.back(); // normal back
  }

  // 🔹 kitne din pehle (2d, 5d etc)
  getDaysAgo(date: string): string {
    if (!date) return '-';

    const created = new Date(date);
    const now = new Date();

    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d';

    return `${diffDays}d`;
  }

  // 🔹 formatted date (21st May)
  getFormattedDate(date: string): string {
    if (!date) return '-';

    const d = new Date(date);
    const day = d.getDate();

    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';

    const month = d.toLocaleString('en-US', { month: 'short' });

    return `${day}${suffix} ${month}`;
  }
}
