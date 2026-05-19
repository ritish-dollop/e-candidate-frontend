import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { SocketService } from '../../../../socket-services/socket.service';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import { ChatUserResponseDto, UserResponse } from '../../../interfaces/user-request';
import { MailService } from '../../../services/email-service/email-service.service';
import { AttachmentDTO, MailResponseDTO } from '../../../interfaces/email';
import { GmailTimePipe } from '../../../pipes/gmail-time.pipe';
import { RelativeTimePipe } from '../../../pipes/relative-time.pipe';
import { TextEditorComponent } from '../../../../reusable-components/text-editor/text-editor.component';
import { ChatServicesService } from '../../../services/chat-service/chat-services.service';

@Component({
  selector: 'app-email-content',
  standalone: true,
  imports: [CommonModule, FormsModule, GmailTimePipe, RelativeTimePipe, TextEditorComponent],
  templateUrl: './email-content.component.html',
  styleUrls: ['./email-content.component.css']
})
export class EmailContentComponent implements OnInit {
  // Visibility flags
  isReplyCardVisible = false;
  isForwardCardVisible = false;
  isCcVisible = false;
  isBccVisible = false;
  ismailrevertVisible = false;

  // CSS classes for active field highlighting
  toClass = 'send_email';
  ccClass = '';
  bccClass = '';

  // Email data
  selectedEmail!: MailResponseDTO | null;
  selectedAttachment: AttachmentDTO[] = [];
  currentUser!: ChatUserResponseDto | null;

  // Composer state
  toEmailsText = '';
  ccEmailsText = '';
  bccEmailsText = '';
  emailSubject = '';
  emailBody = '';
  attachmentUrls: AttachmentDTO[] = [];

  constructor(
    private emailService: MailService,
    private cloudinary: CloudinaryService,
    private auth: AuthService,
    private socket: SocketService,
    private router: Router,
    private activeRoute: ActivatedRoute,
        private chatServ: ChatServicesService
    
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.chatServ.getCurrentUser().subscribe({
      next: (res: ChatUserResponseDto) => {
        this.currentUser = res;
        if (!this.socket.isConnected) {
          this.socket.connect(this.currentUser.email);
        }
        this.activeRoute.params.subscribe((params: any) => {
          if (params.id) this.getMail(params.id);
        });
      },
  error: (err) => {

  if (err.status === 401 || err.status === 403) {
    this.auth.logout(); // IMPORTANT
    this.router.navigate(['/auth/login']);
    return;
  }

  console.error('Unable to load profile', err);
}

    });
  }

  getMail(id: string): void {
    const mailId = Number(id);
    if (!mailId || !this.currentUser?.commonUserId) return;
    this.emailService.getMail(mailId, this.currentUser.commonUserId).subscribe({
      next: (data) => {
        console.log(data);

this.ismailrevertVisible=false
        this.selectedEmail = data;
        this.selectedAttachment = data.attachments || [];
      },
      error: (err) => console.error(err)
    });
  }

  // Gmail-style toggle handlers
  toggleReplyCard(): void {
    this.isReplyCardVisible = true;
    this.isForwardCardVisible = false;
    this.ismailrevertVisible = true;
    this.emailSubject = `Re: ${this.selectedEmail?.subject || ''}`;
    this.toEmailsText = this.selectedEmail?.from || '';
    this.emailBody = ''; // Clear for new reply
  }

  toggleForwardCard(): void {
    this.isForwardCardVisible = true;
    this.isReplyCardVisible = false;
    this.ismailrevertVisible = true;
    this.emailSubject = `Fwd: ${this.selectedEmail?.subject || ''}`;
    this.toEmailsText = '';
    this.emailBody = `Forwarded message - ${this.selectedEmail?.from} wrote:\n\n${this.selectedEmail?.body || ''}`;
  }

  toggleCcField(): void {
    this.isCcVisible = !this.isCcVisible;
    if (this.isCcVisible) {
      this.toClass = ''; this.ccClass = 'send_email'; this.bccClass = '';
    } else {
      this.ccClass = ''; this.toClass = 'send_email';
    }
  }

  toggleBccField(): void {
    this.isBccVisible = !this.isBccVisible;
    if (this.isBccVisible) {
      this.toClass = ''; this.bccClass = 'send_email'; this.ccClass = '';
    } else {
      this.bccClass = ''; this.toClass = 'send_email';
    }
  }

  // Utility methods (keep your existing)
  getFileIcon(contentType: string): string {
    if (!contentType) return 'assets/images/svg-img/file.svg';
    contentType = contentType.toLowerCase();
    if (contentType.includes('pdf')) return 'assets/images/svg-img/pdf.svg';
    if (contentType.includes('zip')) return 'assets/images/svg-img/zip.svg';
    if (contentType.includes('msword') || contentType.includes('word')) return 'assets/images/svg-img/doc.svg';
    return 'assets/images/svg-img/file.svg';
  }

  downloadAttachment(file: AttachmentDTO): void {
    const a = document.createElement('a');
    a.href = file.url;
    a.target = '_blank';
    a.download = file.filename;
    a.click();
  }

  convertSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Send with proper validation (Gmail-style)
  async send(): Promise<void> {
    if (!this.currentUser || !this.selectedEmail) return;

    const toEmails = this.toEmailsText.split(',').map(e => e.trim()).filter(e => e);
    if (!toEmails.length) {
      alert('Please add at least one recipient');
      return;
    }

    const actionType = this.isReplyCardVisible ? 'REPLY' : this.isForwardCardVisible ? 'FORWARD' : 'NEW';
    const parentMailId = this.selectedEmail.mailId;

    const payload = {
      from: this.currentUser.email,
      to: toEmails,
      cc: this.ccEmailsText ? this.ccEmailsText.split(',').map(e => e.trim()).filter(e => e) : [],
      bcc: this.bccEmailsText ? this.bccEmailsText.split(',').map(e => e.trim()).filter(e => e) : [],
      subject: this.emailSubject || this.selectedEmail?.subject || '',
      body: this.emailBody,
      actionType,
      parentMailId,
      attachments: this.attachmentUrls
    };

    console.log('Sending:', payload);

    try {
      this.socket.emit('send_email', payload);
      alert('Email sent successfully!');
      this.resetComposer();
    } catch (err) {
      console.error('Send failed:', err);
      alert('Failed to send email');
    }
  }

  resetComposer(): void {
    this.isReplyCardVisible = false;
    this.isForwardCardVisible = false;
    this.ismailrevertVisible = false;
    this.isCcVisible = false;
    this.isBccVisible = false;
    this.toClass = 'send_email'; this.ccClass = ''; this.bccClass = '';

    this.toEmailsText = this.ccEmailsText = this.bccEmailsText = '';
    this.emailSubject = this.emailBody = '';
    this.attachmentUrls = [];
  }
}
