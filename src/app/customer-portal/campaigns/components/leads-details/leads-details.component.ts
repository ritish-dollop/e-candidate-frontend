import { CommonModule, Location } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { LeadService } from '../../../services/lead.service';
import { Lead } from '../../../models/Lead.model';
import { AuthService } from '../../../../auth/services/auth.service';
declare var bootstrap: any;

@Component({
  selector: 'app-leads-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './leads-details.component.html',
  styleUrls: ['./leads-details.component.css'],
})
export class LeadsDetailsComponent implements OnInit, AfterViewInit {
  campaignId!: number;
  campaignName: string = '';
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
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    const state = history.state;

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

    if (state && state.campaignName) {
    this.campaignName = state.campaignName;
    localStorage.setItem('campaignName', this.campaignName);
  } else {
    this.campaignName = localStorage.getItem('campaignName') || '';
  }
    if (this.campaignId) {
      this.loadLeads();
    }
  }
isAdmin(): boolean {
  return this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('BRANCH_ADMIN');
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
            commentCount: Number(l.commentCount ?? 0) // 🔥 FORCE NUMBER
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
        commentCount: Number(l.commentCount ?? 0)
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

    this.leadService.filterLeadsByStatus(this.campaignId, status).subscribe({
      next: (res: any[]) => {
        this.filteredLeads = res.map(l => ({
        ...l,
        commentCount: l.commentCount ?? 0
      }));

        this.leads = res;
        this.totalPages = 1;
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

  // ----------------------------- SAVE LEAD METHOD -----------------------------
  formErrors: any = {};

 saveLead() {
    this.formErrors = {};

    const formData = new FormData();
    formData.append('applicantName', this.lead.applicantName);
    formData.append('email', this.lead.email);
    formData.append('contactNo', this.lead.contactNo);
    formData.append('scorecardScore', this.lead.scorecardScore);
    formData.append('status', this.lead.status);
    formData.append('appliedDate', this.lead.appliedDate);
    formData.append('lastEditDate', this.lead.lastEditDate);
    formData.append('nextTaskDate', this.lead.nextTaskDate);
    // formData.append('commentCount',this.lead.commentCount);
    formData.append('campaignId', String(this.campaignId));

    if (this.profileImage) formData.append('profileImage', this.profileImage);
   if (this.resumeFile && this.resumeFile.size > 0) {
    formData.append('applicantFiles', this.resumeFile);
}


    this.loading = true;

    this.leadService.createLead(formData).subscribe({
      next: (res: any) => {

        this.loading = false;

        alert("Lead added successfully!");

        this.resetForm();

        this.closeAddLeadModal();

        this.loadLeads();
      },

      error: (err) => {
        this.loading = false;

        if (err.status === 400 && typeof err.error.message === "object") {
          this.formErrors = err.error.message;
        } else {
          alert("Something went wrong!");
        }
      }
    });
  }

  closeAddLeadModal() {
  const modalEl = document.getElementById('addLeadModal');
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.hide();

  // 🔥 CLEANUP (MOST IMPORTANT)
  document.body.classList.remove('modal-open');
  document.querySelectorAll('.modal-backdrop')
    .forEach(b => b.remove());
}

  resetForm() {
    // RESET Angular form state (touched/dirty/submitted)
    this.leadForm.resetForm({
      applicantName: '',
      email: '',
      contactNo: '',
      scorecardScore: '',
      status: 'UNADDRESSED',
      appliedDate: '',
      lastEditDate: '',
      nextTaskDate: '',
    });

    this.profileImage = null;
    this.resumeFile = null;

    if (this.profileInput) this.profileInput.nativeElement.value = '';
    if (this.resumeInput) this.resumeInput.nativeElement.value = '';

    this.formErrors = {};
    this.profileError = null;
    this.resumeError = null;
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
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  const month = d.toLocaleString('en-US', { month: 'short' });

  return `${day}${suffix} ${month}`;
}

}