import { Component, OnInit } from '@angular/core';
import { JobPost } from '../../../../customer-portal/models/JobPost.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { JobpostService } from '../../../../customer-portal/services/jobpost.service';
import { CustomerRolePipe } from '../../../../customer-portal/Pipe/customer-role.pipe';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-jobpost',
  imports: [CommonModule,CustomerRolePipe],
  templateUrl: './jobpost.component.html',
  styleUrl: './jobpost.component.css'
})
export class JobpostComponent implements OnInit {
  jobPosts: JobPost[] = [];
  customerId!: number;
  selectedJob: JobPost | null = null;
  totalCount = 0;
  currentFilterStatus: string | null = null;
  isFilterApplied: boolean = false;
  isStatusDropdownOpen: boolean = false;

  constructor(private jobpostService: JobpostService, private route: ActivatedRoute,private notificationSocket: NotificationSocketService) { }

  private notificationSub?: Subscription;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('customerId');
      this.customerId = Number(id);
      this.loadJobPosts();
    });
    this.notificationSub =
    this.notificationSocket.notification$.subscribe(n => {

      if (!n) return;

      // ✅ ONLY JOB CREATE EVENT
      if (n.type === 'JOB_POST_CREATED' && n.entityType === 'JOB_POST') {
        console.log('🆕 Job created notification → reload job list');
        this.loadJobPosts();
      }
        this.loadJobPosts();
    });
  }

  loadJobPosts(): void {
    this.jobpostService.getJobPostsByCustomer(this.customerId).subscribe({
      next: (res) => {
        this.jobPosts = res;
        this.totalCount = res.length;
        if (res.length && res[0].id) {
          this.selectJob(res[0]); // backend call
        }
      },
      error: (err) => {
        console.error('Failed to load job posts', err);
        this.jobPosts = [];
        this.selectedJob = null;
      }
    });
  }

  selectJob(job: JobPost) {
    if (!job.id) return;

    this.jobpostService.getJobPostById(job.id).subscribe({
      next: (res) => {
        this.selectedJob = res;
      },
      error: (err) => {
        console.error('Failed to load job details', err);
        this.selectedJob = null;
      }
    });
  }


  trackByJobId(index: number, job: JobPost): any {
    return job.id;
  }

  getStatusColor(status: JobPost['status']): string {
    switch (status) {
      case 'PENDING': return 'primary'; 
      case 'APPROVED': return 'success'; 
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusBadgeClass(status: JobPost['status']): string {
    return `bg-${this.getStatusColor(status)}`;
  }

  approveJob() {
  if (!this.selectedJob?.id) return;

  this.jobpostService.updateJobPostStatus(this.selectedJob.id, 'APPROVED')
    .subscribe({
      next: (res) => {
        this.selectedJob = res;
        this.updateJobInList(res);

        // 🔔 SOCKET EMIT (VERY IMPORTANT)
        this.notificationSocket.emit('send_notification', {
          title: 'Job Approved',
          message: `Your job "${res.jobTitle}" has been approved.`,
          type: 'JOB_POST_UPDATED',
          entityType: 'JOB_POST',
          entityId: res.id,
          recipientType: 'CUSTOMER_USER',
          recipientId: res.createdByCustomerUserId // ⚠️ correct customer id
        });

        Swal.fire('Approved', 'Job post approved successfully', 'success');
      }
    });
}


rejectJob() {
  if (!this.selectedJob?.id) return;

  this.jobpostService.updateJobPostStatus(this.selectedJob.id, 'REJECTED')
    .subscribe({
      next: (res) => {
        this.selectedJob = res;
        this.updateJobInList(res);

        this.notificationSocket.emit('send_notification', {
          title: 'Job Rejected',
          message: `Your job "${res.jobTitle}" has been rejected.`,
          type: 'JOB_POST_UPDATED',
          entityType: 'JOB_POST',
          entityId: res.id,
          recipientType: 'CUSTOMER_USER',
          recipientId: res.createdByCustomerUserId
        });

        Swal.fire('Rejected', 'Job post rejected successfully', 'success');
      }
    });
}


private updateJobInList(updatedJob: JobPost) {
  const index = this.jobPosts.findIndex(j => j.id === updatedJob.id);
  if (index !== -1) {
    this.jobPosts[index] = {
      ...this.jobPosts[index],
      status: updatedJob.status
    };
  }
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
    this.isStatusDropdownOpen = false;
    this.loadJobPosts();
  }

  toggleStatusDropdown(): void {
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }


}
