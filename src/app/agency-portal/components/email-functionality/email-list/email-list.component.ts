import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import {
  ChatUserResponseDto,
  UserResponse,
} from '../../../interfaces/user-request';
import { AuthService } from '../../../../auth/services/auth.service';
import { SocketService } from '../../../../socket-services/socket.service';
import { AttachmentDTO, MailResponseDTO } from '../../../interfaces/email';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { GmailTimePipe } from '../../../pipes/gmail-time.pipe';
import { MailService } from '../../../services/email-service/email-service.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { UserService } from '../../../services/user-service/user.service';
import { TextEditorComponent } from '../../../../reusable-components/text-editor/text-editor.component';
import { ChatServicesService } from '../../../services/chat-service/chat-services.service';
@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GmailTimePipe,
    RouterLink,
    TextEditorComponent,
  ],
  templateUrl: './email-list.component.html',
  styleUrls: ['./email-list.component.css'],
})
export class EmailListComponent implements OnInit, OnDestroy {
  isCcVisible = false;
  isBccVisible = false;
  toEmails: string[] = [];
  ccEmails: string[] = [];
  bccEmails: string[] = [];
  toInput = '';
  ccInput = '';
  bccInput = '';
  emailSubject = '';
  emailBody = '';
  showEmojiPicker = false;
  attachmentUrls: AttachmentDTO[] = [];
  // rawFiles: File[] = [];

  // UI State
  currentUser!: ChatUserResponseDto | null;
  emails: MailResponseDTO[] = [];
  filteredEmails: MailResponseDTO[] = [];
  starState: number = 0;

  // ViewChild references - FIXED (single declarations)
  @ViewChild('editor', { static: false }) editor!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInputAttachment', { static: false })
  fileInputAttachment!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputImage', { static: false })
  fileInputImage!: ElementRef<HTMLInputElement>;

  emojis: string[] = [
    '😀',
    '😁',
    '😂',
    '🤣',
    '😃',
    '😄',
    '😍',
    '🥰',
    '😢',
    '😭',
    '👍',
    '❤️',
    '🔥',
    '⭐',
  ];

  constructor(
    private emailService: MailService,
    private cloudinary: CloudinaryService,
    private auth: AuthService,
    private socket: SocketService,
    private router: Router,
    private userServ: UserService,
    private chatServ: ChatServicesService
  ) {}

  // Search
  searchTerm: string = '';
  private search$ = new Subject<string>();
  private sub = new Subscription();

  // socket/user flags
  private listenersLoaded = false;

  ngOnInit(): void {
    this.loadUser();
    // Search subscription is fine here
    this.sub.add(
      this.search$.pipe(debounceTime(250)).subscribe((term) => {
        this.searchTerm = term;
        this.applyFilters();
      })
    );
  }
  listen = false;
  loadUser(): void {
    this.chatServ.getCurrentUser().subscribe({
      next: (res: ChatUserResponseDto) => {
        this.currentUser = res;
        console.log(res);

        if (!this.socket.isConnected) {
          this.socket.connect(this.currentUser.email);

          // Attach listeners only once
        }
        if (!this.listen) this.loadMessageListeners();

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

  selectedFolder: string = 'Inbox';
  dropdownOpen: boolean = false;

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectFolder(folder: string): void {
    this.selectedFolder = folder;
    this.dropdownOpen = false;
    this.emitForSocket('load_' + folder, this.currentUser?.commonUserId);
    this.applyFilters();
  }

  // ----------------------
  // Filtering logic
  // ----------------------
  private applyFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();

    this.filteredEmails = this.emails.reverse().filter((mail) => {
      // 1) Folder filtering
      if (this.selectedFolder && this.selectedFolder !== 'Inbox') {
        if (this.selectedFolder === 'Starred') {
          if (!mail.starred) return false;
        } else if (this.selectedFolder === 'Trash') {
          if (!mail.deleted) return false;
        } else if (this.selectedFolder === 'Sent') {
          if (mail.folder !== 'SENT') return false;
        } else {
          // INBOX case
          if (mail.folder !== 'INBOX') return false;
        }
      }

      // 2) Search filter
      if (!term) return true;

      const haystack = (
        (mail.from || '') +
        ' ' +
        (mail.subject || '') +
        ' ' +
        (mail.body || '')
      ).toLowerCase();

      return haystack.includes(term);
    });
  }

  ngOnDestroy(): void {
    // unsubscribe safely
    if (this.sub) {
      this.sub.unsubscribe();
    }

    // safely cleanup socket
    if (this.socket && this.socket.isConnected) {
      this.socket.off('load_mails');
      this.socket.disconnect();
    }
  }

  // ----------------------
  // Search handlers
  // ----------------------
  onSearch(value: string): void {
    this.search$.next(value || '');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search$.next('');
  }

  // ----------------------
  // Star toggle (prevents button click from also selecting tab)
  // ----------------------
// toggleStar(mail: MailResponseDTO, e: MouseEvent) {
//   e.stopPropagation();

//   if (!this.currentUser) {
//     return;
//   }

//   mail.starred = !mail.starred;

//   this.socket.emit('toggle_star', {
//     mailId: mail.mailId,
//     userId: this.currentUser.commonUserId,
//   });
// }
toggleStar(mail: MailResponseDTO, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  mail.starred = !mail.starred;

  this.socket.emit('toggle_star', {
    mailId: mail.mailId,
    userId: this.currentUser!.commonUserId,
  });
}
selectedIndex = 0;

openMail(mail: MailResponseDTO) {
  this.router.navigate(['email-containt', mail.mailId]);
}

  // CC/BCC toggle
  toggleCcField(): void {
    this.isCcVisible = !this.isCcVisible;
  }

  toggleBccField(): void {
    this.isBccVisible = !this.isBccVisible;
  }

  // Chip management
  addTo(): void {
    const value = this.toInput.trim();
    if (value && !this.toEmails.includes(value)) {
      this.toEmails.push(value);
    }
    this.toInput = '';
  }

  addCc(): void {
    const value = this.ccInput.trim();
    if (value && !this.ccEmails.includes(value)) {
      this.ccEmails.push(value);
    }
    this.ccInput = '';
  }

  addBcc(): void {
    const value = this.bccInput.trim();
    if (value && !this.bccEmails.includes(value)) {
      this.bccEmails.push(value);
    }
    this.bccInput = '';
  }

  removeTo(index: number): void {
    this.toEmails.splice(index, 1);
  }

  removeCc(index: number): void {
    this.ccEmails.splice(index, 1);
  }

  removeBcc(index: number): void {
    this.bccEmails.splice(index, 1);
  }

  // Rich text editor - FIXED execCommand calls
  private focusEditor(): void {
    this.editor?.nativeElement.focus();
  }

  format(cmd: string): void {
    this.focusEditor();
    document.execCommand(cmd, false, undefined);
    this.syncBody();
  }

  insertList(type: 'ul' | 'ol'): void {
    this.focusEditor();
    document.execCommand(
      type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList',
      false,
      undefined
    );
    this.syncBody();
  }

  insertQuote(): void {
    this.focusEditor();
    document.execCommand('formatBlock', false, 'blockquote');
    this.syncBody();
  }

  removeFormatting(): void {
    this.focusEditor();
    document.execCommand('removeFormat', false, undefined);
    this.syncBody();
  }

  addLink(): void {
    this.focusEditor();
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      this.syncBody();
    }
  }

  insertCode(): void {
    this.focusEditor();
    document.execCommand('insertHTML', false, '<code>Code</code>');
    this.syncBody();
  }

  onEditorInput(event: Event): void {
    const target = event.target as HTMLElement;
    this.emailBody = target.innerHTML;
  }

  private syncBody(): void {
    if (this.editor?.nativeElement) {
      this.emailBody = this.editor.nativeElement.innerHTML;
    }
  }

  // Emoji
  openEmoji(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.focusEditor();
    document.execCommand('insertText', false, emoji);
    this.syncBody();
    this.showEmojiPicker = false;
  }

  // File uploads - FIXED
  uploadAttachment(): void {
    this.fileInputAttachment?.nativeElement.click();
  }

  uploadImage(): void {
    this.fileInputImage?.nativeElement.click();
  }

  async onAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      const url = await this.cloudinary.uploadFile(file);
      this.attachmentUrls.push({
        filename: file.name,
        contentType: file.type,
        url: url,
        size: file.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    input.value = '';
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      const url = await this.cloudinary.uploadFile(file);
      this.attachmentUrls.push({
        filename: file.name,
        contentType: file.type,
        url: url,
        size: file.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
    input.value = '';
  }

  loadMessageListeners(): void {
    this.listen = true;
    // this.socket.off('load_mails');
    // this.socket.off('recieve_email');
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
  toSuggestions: string[] = [];
  ccSuggestions: string[] = [];
  bccSuggestions: string[] = [];

  private searchTimeout: any;

  searchEmail(value: string, type: 'to' | 'cc' | 'bcc') {
    if (!value || value.length < 2) {
      this.clearSuggestions(type);
      return;
    }

    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.userServ.searchEmails(value).subscribe((res) => {
        console.log(res);

        if (type === 'to') this.toSuggestions = res;
        if (type === 'cc') this.ccSuggestions = res;
        if (type === 'bcc') this.bccSuggestions = res;
      });
    }, 300); // debounce
  }
  clearSuggestions(type: string) {
    if (type === 'to') this.toSuggestions = [];
    if (type === 'cc') this.ccSuggestions = [];
    if (type === 'bcc') this.bccSuggestions = [];
  }
  selectEmail(email: string, type: 'to' | 'cc' | 'bcc') {
    if (type === 'to') {
      this.toEmails.push(email);
      this.toInput = '';
      this.toSuggestions = [];
    }
    if (type === 'cc') {
      this.ccEmails.push(email);
      this.ccInput = '';
      this.ccSuggestions = [];
    }
    if (type === 'bcc') {
      this.bccEmails.push(email);
      this.bccInput = '';
      this.bccSuggestions = [];
    }
  }

  // Send email - FIXED
  async sendEmail(): Promise<void> {
    this.syncBody();
    console.log(this.emailBody);
    console.log(this.attachmentUrls);

    if (!this.currentUser?.email || this.toEmails.length === 0) {
      alert('Please add recipient(s)');
      return;
    }

    const payload = {
      from: this.currentUser.email,
      to: this.toEmails,
      cc: this.ccEmails,
      bcc: this.bccEmails,
      subject: this.emailSubject,
      body: this.emailBody,
      attachments: this.attachmentUrls,
    };
    console.log(payload);

    try {
      this.socket.emit('send_email', payload);
      alert('Email Sent!');

      // Reset form
      this.closeMessageModal();
      this.resetForm();
    } catch (err) {
      console.error('Send failed:', err);
      alert('Failed to send email');
    }
  }

  closeMessageModal(): void {
    const modalEl = document.getElementById('Message');

    if (!modalEl) return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl);

    if (modalInstance) {
      modalInstance.hide();
    }

    // 🔴 IMPORTANT: cleanup leftover backdrop & body state
    setTimeout(() => {
      document.body.classList.remove('modal-open');

      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach((b) => b.remove());
    }, 300);
  }

  resetForm(): void {
    this.toEmails = [];
    this.ccEmails = [];
    this.bccEmails = [];
    this.emailSubject = '';
    this.emailBody = '';
    if (this.editor?.nativeElement) {
      this.editor.nativeElement.innerHTML = '';
    }
    this.attachmentUrls = [];
    this.showEmojiPicker = false;
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
}
