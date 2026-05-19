import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';


import { LeadService } from '../../../services/lead.service';
import { NoteService } from '../../../services/note.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { Lead } from '../../../models/Lead.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { CustomerRolePipe } from '../../../Pipe/customer-role.pipe';

@Component({
  selector: 'app-single-lead-detail',
  imports: [FormsModule, CommonModule,CustomerRolePipe],
  templateUrl: './single-lead-detail.component.html',
  styleUrl: './single-lead-detail.component.css',
})
export class SingleLeadDetailComponent {
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
    private auth: AuthService
  ) {}

  ngOnInit(): void {
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
    }
    const uid = localStorage.getItem('customerUserId');

    if (!uid) {
      console.error('❌ customerUserId missing');
      return;
    }

    this.userId = Number(uid);
    console.log('Campaign ID Loaded → ', this.campaignId);
    this.leadId = Number(this.route.snapshot.paramMap.get('leadId'));
    this.fetchLeadDetails();
    this.loadNotes();
    this.loadFiles();
  }

  isAdmin(): boolean {
    return this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('BRANCH_ADMIN');
  }

  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }

  fetchLeadDetails() {
    this.leadService.getLeadById(this.leadId).subscribe({
      next: (res) => {
        this.lead = res;
        console.log('Single Lead Data → ', this.lead);
      },
      error: (err) => console.error('Lead Fetch Error:', err),
    });
  }

  updateLeadStatus(leadId: number, newStatus: string) {
    this.leadService.changeLeadStatus(leadId, newStatus).subscribe({
      next: () => {
        this.lead.status = newStatus;
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
      },
      error: (err) => console.error('Error loading notes:', err),
    });
  }

  addNote() {
    if (!this.newNote.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Empty Note',
      text: 'Please write something before sending the note.',
    });
    return;
  }

    const req = {
      leadId: this.leadId,
      createdById: this.userId,
      content: this.newNote.trim(),
    };

    this.noteService.createNote(req).subscribe({
      next: () => {
        this.newNote = '';
        this.loadNotes();
        Swal.fire({
        icon: 'success',
        title: 'Note Added',
        text: 'Your note has been added successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      },
      error: (err) => {
      console.error('Error creating note:', err);

      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Failed to add note. Please try again.',
      });
    },
    });
  }

 deleteNote(noteId: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This note will be permanently deleted!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  }).then((result) => {

    if (!result.isConfirmed) return;

    this.noteService.deleteNote(noteId).subscribe({
      next: () => {
        this.loadNotes();

        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Note deleted successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('Error deleting note:', err);

        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to delete note. Please try again.',
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

 

  const downloadUrl = file.url.replace(
    '/upload/',
    '/upload/fl_attachment/'
  );

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = file.name;   // 👈 correct
  a.click();
}

deleteFile(file: any, event: Event) {
  event.stopPropagation(); // 🔥 row click se bachane ke liye

  Swal.fire({
    title: 'Are you sure?',
    text: `You want to delete "${file.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  }).then((result) => {

    if (!result.isConfirmed) return;

    // (optional) loading indicator
    Swal.fire({
      title: 'Deleting...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.leadService.deleteLeadFile(this.leadId, file.url)
      .subscribe({
        next: () => {
          this.files = this.files.filter(f => f.url !== file.url);

          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'File deleted successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('Delete file error:', err);

          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete file. Please try again.',
          });
        }
      });
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

    this.leadService.uploadApplicantFile(this.leadId, cloudUrl)
      .subscribe({
        next: () => {
          alert("Applicant Resume Uploaded Successfully");
          this.loadFiles();
        }
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

