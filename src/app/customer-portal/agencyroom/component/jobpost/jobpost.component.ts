import { Component, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JobpostService } from '../../../services/jobpost.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jobpost',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './jobpost.component.html',
  styleUrl: './jobpost.component.css'
})
export class JobpostComponent implements OnInit {
  showCreateForm = false;
  jobPosts: any[] = [];
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  searchText: string = '';
  currentFilterStatus: string | null = null;
  isFilterApplied: boolean = false;
  isStatusDropdownOpen: boolean = false;
  roles: string[] = [];
  page = 0;
  size = 9;
  totalPages = 0;


  constructor(private jobpostService: JobpostService, private auth: AuthService,private notificationSocket: NotificationSocketService) { }

  jobPostForm: any = {
    jobTitle: '',
    description: '',
    requiredSkills: '',
    department: '',
    experienceLevel: '',
    location: '',
    branchId: null,
    customerId: null,
    status: 'PENDING',
    workMode: '',
    workType: '',
    image: ''
  };


  private notificationSub?: Subscription;
  ngOnDestroy(): void {
    this.notificationSub?.unsubscribe();
  }
  ngOnInit(): void {
  this.roles = this.auth.getUserRoles();
    this.loadJobPosts();

    this.connectJobPostSocket();

    this.listenToJobPostNotifications();
}

private connectJobPostSocket(): void {
  this.auth.getCurrentUser().subscribe(user => {
    if (!user) return;

    // ✅ CUSTOMER USER (ONLY customerUserId)
    if (
      user.role === 'CUSTOMER_ADMIN' ||
      user.role === 'CUSTOMER_TEAM_MEMBER'
    ) {
      const customerUserId = user.id; // 🔥 THIS IS THE FIX

      console.log(
        '🔌 JobPost socket connect => CUSTOMER_USER:',
        customerUserId
      );

      this.notificationSocket.connect(
        'CUSTOMER_USER',
        Number(customerUserId)
      );
    }

    // ✅ BRANCH USER
    if (user.role?.startsWith('BRANCH')) {
      console.log(
        '🔌 JobPost socket connect => BRANCH_USER:',
        user.id
      );

      this.notificationSocket.connect(
        'BRANCH_USER',
        Number(user.id)
      );
    }
    // ✅ AGENCY RELATION MANAGER  🔥🔥🔥
    if (user.role === 'AGENCY_RELATIONSHIP_MANAGER') {
      console.log('🔌 JobPost socket connect => AGENCY_USER:', user.id);

      this.notificationSocket.connect(
        'AGENCY_USER',
        Number(user.id)
      );
    }
  });
  
}




  isBranchAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isBranchTeamMember(): boolean {
    return this.roles.includes('BRANCH_TEAM_MEMBER');
  }
  loadJobPosts(): void {
    this.jobpostService.getMyJobPosts(this.page, this.size).subscribe({
      next: (data) => {
        // this.jobPosts = data;
        this.jobPosts = data.content;
        this.totalPages = data.totalPages;
      },
      error: (err) => {
        console.error("Error loading job posts", err);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }


  isSubmitting = false;
  createJobpost(): void {
    this.isSubmitting = true;
    Swal.fire({
    title: 'Creating Job Post...',
    text: 'Please wait',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

    const formData = new FormData();

    const jobPostJson = {
      jobTitle: this.jobPostForm.jobTitle,
      description: this.jobPostForm.description,
      requiredSkills: this.jobPostForm.requiredSkills,
      department: this.jobPostForm.department,
      experienceLevel: this.jobPostForm.experienceLevel,
      location: this.jobPostForm.location,
      status: this.jobPostForm.status,
      workMode: this.jobPostForm.workMode,
      workType: this.jobPostForm.workType
    };


    // Append JSON as string
    formData.append("jobPost", new Blob([JSON.stringify(jobPostJson)], { type: "application/json" }));

    // Append image (if selected)
    if (this.selectedImage) {
      formData.append("image", this.selectedImage);
    }

    this.jobpostService.createJobPost(formData).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Created',
          text: 'Job Post created successfully!',
          timer: 1500,
          showConfirmButton: false
        });

        this.showCreateForm = false;
        this.loadJobPosts();
        this.resetJobPost();
        this.imagePreview = null;
      },
      error: (err) => {
  console.error('❌ JobPost error:', err);

  let title = 'Validation Error';
  let message = '';

  if (err?.error?.errors && Array.isArray(err.error.errors)) {
    message = err.error.errors
      .map((e: any) => ` ${e.defaultMessage}`)
      .join('<br>');
  }

  else if (err?.error?.details && typeof err.error.details === 'object') {
    message = Object.values(err.error.details)
      .map((msg: any) => ` ${msg}`)
      .join('<br>');
  }

  else if (
    err?.error?.message &&
    err.error.message.includes('WorkMode')
  ) {
    message = `
       Work Mode is required<br>
       Please select a valid Work Mode
    `;
  }

  else if (err?.error?.message) {
    message = err.error.message;
  }

  else {
    message = 'Please fill all required fields correctly.';
  }

  Swal.fire({
    icon: 'error',
    title: title,
    html: message,  
    confirmButtonText: 'OK'
  });

  this.isSubmitting = false;
}

    });
  }

  resetJobPost() {
    this.jobPostForm = {
      jobTitle: '',
      description: '',
      requiredSkills: '',
      department: '',
      experienceLevel: '',
      location: '',
      branchId: 1,
      customerId: 1,
      status: 'PENDING',
      workMode: '',
      workType: '',
      image: ''
    };
    this.selectedImage = null;
    this.imagePreview = null;
  }

  openCreateForm(): void {
    this.showCreateForm = true;
  }

  cancelCreateForm(): void {
    this.showCreateForm = false;
    this.resetJobPost();
    this.selectedImage = null;
    this.imagePreview = null;
  }


  submitJobpost(): void {
    this.showCreateForm = false;
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.loadJobPosts();
      return;
    }

    this.jobpostService.searchJobPosts(this.searchText).subscribe({
      next: (data) => this.jobPosts = data,
      error: (err) => console.error('Search error', err)
    });
  }

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  applyStatusFilter(status: string): void {
    this.currentFilterStatus = status;
    this.isFilterApplied = true;
    this.isStatusDropdownOpen = false; // Close dropdown after selection
    this.jobpostService.getJobPostsByStatus(status).subscribe({
      next: (data) => { this.jobPosts = data; },
      error: (err) => { console.error('Error filtering job posts', err); }
    });
  }

  clearFilter(): void {
    this.isFilterApplied = false;
    this.currentFilterStatus = null;
    this.searchText = '';
    this.isStatusDropdownOpen = false;
    this.loadJobPosts();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdownElement = target.closest('.dropdownss');
    if (!dropdownElement && this.isStatusDropdownOpen) {
      this.isStatusDropdownOpen = false;
    }
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadJobPosts();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadJobPosts();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.page = page;
      this.loadJobPosts();
    }
  }
 private listenToJobPostNotifications(): void {
  this.notificationSub =
    this.notificationSocket.notification$.subscribe((n: any) => {

      if (n?.entityType !== 'JOB_POST') return;

      console.log('🔔 JobPost notification received', n);

      // 🔥 INSTANT LOCAL UPDATE
      const index = this.jobPosts.findIndex(j => j.id === n.entityId);
      if (index !== -1 && n.newStatus) {
        this.jobPosts[index] = {
          ...this.jobPosts[index],
          status: n.newStatus
        };
      }

      // 🔄 SAFETY RELOAD (optional)
      this.loadJobPosts();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Job Status Updated',
        text: n.message,
        timer: 3000,
        showConfirmButton: false
      });
    });
}

getStatusClass(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'status-approved';
    case 'REJECTED':
      return 'status-rejected';
    case 'PENDING':
      return 'status-pending';
    default:
      return 'status-pending';
  }
}



}