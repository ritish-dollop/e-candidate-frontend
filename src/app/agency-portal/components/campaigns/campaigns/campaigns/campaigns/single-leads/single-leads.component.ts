import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../../../../auth/services/auth.service';
import { Lead } from '../../../../../../../customer-portal/models/Lead.model';
import { LeadService } from '../../../../../../../customer-portal/services/lead.service';
import { NoteService } from '../../../../../../../customer-portal/services/note.service';
import { SocketService } from '../../../../../../../socket-services/socket.service';
import { UserResponse } from '../../../../../../interfaces/user-request';
import { CloudinaryService } from '../../../../../../services/chat-service/cloudnary.service';

@Component({
  selector: 'app-single-leads',
  imports: [CommonModule, FormsModule],
  templateUrl: './single-leads.component.html',
  styleUrl: './single-leads.component.css',
})
export class SingleLeadsComponent {
  leadId!: number;
  lead!: Lead;
  campaignId: number | null = null;
  notes: any[] = [];
  newNote: string = '';
  userId: number = 1;
  files: any[] = [];
  applicantFile: File | null = null;

  selectedFileName: string = '';
  customerFile: File | null = null;

  roles: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private leadService: LeadService,
    private noteService: NoteService,
    private cloudinaryServ: CloudinaryService,
    private location: Location,
    private auth: AuthService,
    private socket: SocketService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.roles = this.auth.getUserRoles();
    this.campaignId = history.state?.campaignId;
     if (this.campaignId) {
      localStorage.setItem('campaignId', this.campaignId.toString());
    }

    if (!this.campaignId) {
      const parent = this.route.parent?.snapshot.paramMap.get('campaignId');
      this.campaignId = parent ? Number(parent) : null;

      if (this.campaignId) {
        localStorage.setItem('campaignId', this.campaignId.toString());
      }

      console.log('Campaign ID Loaded → ', this.campaignId);
      this.leadId = Number(this.route.snapshot.paramMap.get('leadId'));
      this.fetchLeadDetails();
      this.loadNotes();
      this.loadFiles();
      this.leadService.abcCall$.subscribe(() => {
        if (this.leadId) this.fetchLeadDetails();
      });

      this.socket.updateLead$.subscribe((data) => {
        console.log('Component A received', data);
        if (this.leadId) this.fetchLeadDetails();
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
  isAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }

  fetchLeadDetails() {
    this.leadService.getLeadById(this.leadId).subscribe({
      next: (res) => {
        console.log(res);
        this.lead = res;
        console.log('Single Lead Data → ', this.lead);
      },
      error: (err) => console.error('Lead Fetch Error:', err),
    });
  }

  updateLeadStatus(leadId: number, newStatus: string) {
    this.leadService.changeLeadStatus(leadId, newStatus).subscribe({
      next: () => {
        this.socket.emit('updateLead', {
          leadId: leadId,
          status: newStatus,
        });

        this.lead.status = newStatus;
        this.lead.lastEditDate = new Date().toISOString();
        console.log('Status updated:', newStatus);
      },
      error: (err) => {
        console.error('Error updating lead status:', err);
      },
    });
  }

  getStatusClass(status?: string): string {
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

  // ---------------- NOTES ----------------
  loadNotes() {
    this.noteService.getNotesByLead(this.leadId).subscribe({
      next: (res) => {
        this.notes = res;
        if (this.lead) {
          this.lead.commentCount = res.length;
        }
      },
      error: (err) => console.error('Error loading notes:', err),
    });
  }

  addNote() {
    if (!this.newNote.trim()) return;

    const req = {
      leadId: this.leadId,
      createdById: this.userId,
      content: this.newNote.trim(),
    };

    this.noteService.createNote(req).subscribe({
      next: () => {
        this.newNote = '';
        Swal.fire({
          icon: 'success',
          title: 'Note Created 🎉',
          text: 'Note created successfully',
          timer: 2000,
          showConfirmButton: false,
        });
        if (this.lead) {
          this.lead.commentCount = (this.lead.commentCount || 0) + 1;
          this.lead.lastEditDate = new Date().toISOString();
        }
        this.loadNotes();
      },
      error: (err) => console.error('Error creating note:', err),
    });
  }

  deleteNote(noteId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This note will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.noteService.deleteNote(noteId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Note Deleted 🗑️',
            text: 'Note deleted successfully',
            timer: 2000,
            showConfirmButton: false,
          });

          if (this.lead) {
            this.lead.commentCount = Math.max(
              (this.lead.commentCount || 1) - 1,
              0
            );
            this.lead.lastEditDate = new Date().toISOString();
          }

          this.loadNotes(); // reload
        },
        error: (err) => {
          console.error('Error deleting note:', err);

          Swal.fire({
            icon: 'error',
            title: 'Delete Failed ❌',
            text: 'Failed to delete note',
          });
        },
      });
    });
  }

  // ---------------- FILE DOWNLOAD / DELETE ----------------
  openFile(file: any, event: Event) {
    event.stopPropagation(); // 🔥 important

    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name.pdf;
    a.target = '_blank';
    a.click();
  }

  downloadFile(file: any, event: Event) {
    event.stopPropagation();

    const downloadUrl = file.url.replace('/upload/', '/upload/fl_attachment/');

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name; // 👈 correct
    a.click();
  }

  deleteFile(file: any, event: Event) {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    this.leadService.deleteLeadFile(this.leadId, file.url).subscribe({
      next: () => {
        alert('File deleted successfully');
        this.files = this.files.filter((f) => f.url !== file.url);
      },
      error: (err) => console.error('Delete file error:', err),
    });
  }

  //   async onCustomerFileUpload(event: any) {
  //   this.customerFile = event.target.files[0];
  //   if (!this.customerFile) return;

  //   console.log("Customer File Selected:", this.customerFile.name);

  //   this.leadService.uploadCustomerFile(this.leadId, this.customerFile, this.userId)
  //     .subscribe({
  //       next: () => {
  //         alert("Customer Document Uploaded");
  //         this.loadFiles();   // refresh list
  //       },
  //       error: (err) => console.log(err)
  //     });
  // }

  async onApplicantFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // 🔴 Only PDF allow
    if (file.type !== 'application/pdf') {
      alert('Only PDF files allowed');
      return;
    }
    const cloudUrl = await this.cloudinaryServ.uploadFile(file);

    this.leadService.uploadApplicantFile(this.leadId, cloudUrl).subscribe({
      next: () => {
        alert('Applicant Resume Uploaded Successfully');
        this.loadFiles();
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 KB';
    let k = 1024;
    let sizes = ['Bytes', 'KB', 'MB', 'GB'];
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  extractFileName(url: string): string {
    try {
      const withoutQuery = url.split('?')[0];
      return withoutQuery.substring(withoutQuery.lastIndexOf('/') + 1);
    } catch {
      return url;
    }
  }

  loadFiles() {
    this.leadService.getAllFilesOfLead(this.leadId).subscribe({
      next: async (urls: string[]) => {
        this.files = [];

        for (const url of urls) {
          const size = await this.getFileSize(url);

          this.files.push({
            url: url,
            name: this.extractFileName(url),
            type: url.includes('resume') ? 'resume' : 'customer',
            size: this.formatFileSize(size),
          });
        }
      },
      error: (err) => console.error(err),
    });
  }
  async getFileSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      return size ? Number(size) : 0;
    } catch {
      return 0;
    }
  }

  goBack() {
    this.location.back(); // normal back
  }
}
