import { Component, OnInit } from '@angular/core';
import { ActionButtonComponent } from "../../../../reusable-components/action-button/action-button.component";
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { SocketService } from '../../../../socket-services/socket.service';
import { ChatUserResponseDto, UserResponse } from '../../../interfaces/user-request';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import { MailService } from '../../../services/email-service/email-service.service';
import { MailResponseDTO } from '../../../interfaces/email';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatServicesService } from '../../../services/chat-service/chat-services.service';

@Component({
  selector: 'app-emails',
  templateUrl: './emails.component.html',
  styleUrls: ['./emails.component.css'],
  imports: [ActionButtonComponent,RouterLink,FormsModule,CommonModule]
})
export class EmailsComponent implements OnInit{
  // componenetRoutes=ComponentsRoutes;
    currentUser!: ChatUserResponseDto | null;
    emails: MailResponseDTO[] = [];
    filteredEmails: MailResponseDTO[] = [];
    constructor(
    private emailService: MailService,
    private cloudinary: CloudinaryService,
    private auth: AuthService,
    private socket: SocketService,
    private router: Router,private chatService : ChatServicesService
  ) {}
  ngOnInit(): void {
   this.loadUser();
  }
  loadUser(): void {
    this.chatService.getCurrentUser().subscribe({
      next: (res: ChatUserResponseDto) => {
        this.currentUser = res;

        if (!this.socket.isConnected) {
          this.socket.connect(this.currentUser.email);

          // Attach listeners only once
          this.loadMessageListeners();
        }

        // Load INBOX by default
        this.emitForSocket('load_Inbox', this.currentUser.commonUserId);
      },
      error: (err) => {
        console.log('ERROR BLOCK HIT', err.status);

        if (err.status === 401 || err.status === 403) {
          console.log('LOGOUT + NAVIGATE');
          this.auth.logout();
          this.router.navigate(['/auth/login']);
          return;
        }

        console.error('Unable to load profile', err);
      },
    });
  }
  loadMessageListeners(): void {

  this.socket.off('load_mails');
  this.socket.off('recieve_email');

  this.socket.on('load_mails', (msg: MailResponseDTO[]) => {
    console.log(msg);
    this.emails = Array.isArray(msg) ? msg : [];
    this.applyFilters();
  });

  this.socket.on('recieve_email', (msg: MailResponseDTO) => {
    console.log(msg);
    this.emails.push(msg);
    this.applyFilters();
  });
}


  emitForSocket(event: string, data: any): void {
    this.socket.emit(event, data);
  }
getPreview(html: string, length: number): string {
  if (!html) return '';

  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, '');

  // Normalize spaces
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Apply limit safely
  return cleanText.length > length
    ? cleanText.substring(0, length) + '...'
    : cleanText;
}

private applyFilters(): void {
  // Get last 3 emails (safe copy)
  this.filteredEmails = this.emails.slice(-3).reverse();
}
}
