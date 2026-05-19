import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import Swiper from 'swiper';
import { EffectCards } from 'swiper/modules';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/services/auth.service';
import { SocketService } from '../../../../socket-services/socket.service';
import {
  ChatListComponent,
  ChatMessageResponse,
  ChatRoomResponse,
} from '../chat-list/chat-list.component';
import {
  ChatUserResponseDto,
  UserResponse,
} from '../../../interfaces/user-request';
import { ChatServicesService } from '../../../services/chat-service/chat-services.service';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import { UserService } from '../../../services/user-service/user.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { firstValueFrom } from 'rxjs';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

Swiper.use([EffectCards]);

@Component({
  selector: 'app-chat-box',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PdfViewerModule,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.css'],
})
export class ChatBoxComponent implements OnInit {
  constructor(
    private activeRoute: ActivatedRoute,
    private serv: ChatServicesService,
    private router: Router,
    private auth: AuthService,
    private cloudinary: CloudinaryService,
    private socket: SocketService,
    private userServ: UserService,
    private location: Location
  ) { }
  replyingTo: ChatMessageResponse | null = null;
  showReplyBox: boolean = false;

  replyId: number = 0; // old code kept for backend

  selectedChat: number | null = null;
  selectedChatName: string = '';
  selectedChatimage: string = '';
  chat!: ChatRoomResponse;
  otherParticipant?: ChatUserResponseDto;
  otherParticipants: ChatUserResponseDto[] = [];
  isChatBoxVisible: boolean = false;
  currentUserId: number = 0;
  isSidebarVisible: boolean = false;
  messageText: string = '';
  chatMessageSend!: ChatMessageResponse;
  images: { type: string; url: string; name?: string }[] = [];
  rawFiles: File[] = []; // actual File objects to send
  imageShow: boolean = false; // whether preview area visible

  groupedMessages: any[] = [];
  showDots: number | null = null;
  showDropdown: number | null = null;
  currentUser!: ChatUserResponseDto | null;
  loading: boolean = true;
  error: string = '';

  @ViewChild('messageBody') messageBody!: ElementRef;
  @ViewChild(ChatListComponent, { static: false })
  chatListComponent!: ChatListComponent;
  // ==========================
  // INIT
  // ==========================
  listen = false;
  ngOnInit(): void {
    // this.isChatBoxVisible = true;

    this.serv.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.currentUserId = user.commonUserId;
        this.loading = false;
        if (!this.socket.isConnected) {
          this.socket.connect(user.email);
        }
        if (!this.listen) this.listenForIncomingMsg();
        this.activeRoute.params.subscribe((data: any) => {
          if (data.id) this.selectChat(data.id);
        });
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      },
    });
  }

  listenForIncomingMsg() {
    this.listen = true;
    this.socket.off('receive_message');
    this.socket.off('message_delivered');
    this.socket.off('msg_delivered');

    this.socket.on('receive_message', (msg: ChatMessageResponse) => {
      console.log(msg);
      if (!this.chat) return;
      console.log('2345678909876543');
      this.socket.emit('mark_read', msg.id);
      if (msg.chatRoomId === this.chat.id) {
        this.selectChat(msg.chatRoomId.toString());
        this.groupMessages(this.chat.messageResponse);
        setTimeout(() => this.scrollToBottom(), 30);
      }
    });

    this.socket.on('read_update', (msg: any) => {
      this.socket.callAbc();
      console.log(msg);

      this.chatListComponent.refreshChats();
      this.selectChat(msg.chatRoomId.toString());
    });

    this.socket.on('msg_delivered', (msg: ChatMessageResponse) => {
      console.log(msg);
      this.selectChat(msg.chatRoomId.toString());
      this.socket.callAbc();
      if (msg && this.chatListComponent) {
        console.log('jijrfbiurefjbrje');

        this.chatListComponent.refreshChats();

        // ✅ SAFE call
      }
    });
  }

  scrollToBottom() {
    try {
      const container = this.messageBody.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch { }
  }

  source: boolean = false;
  selectChat(chatId: string) {
    const roomId = Number(chatId);
    if (!roomId) return;
    this.selectedChat = roomId;
    this.isChatBoxVisible = true;
    this.serv.getChatRoomsById(roomId).subscribe({
      next: (chat) => {
        console.log(chat);
        this.isChatBoxVisible = true;
        this.socket.emit('mark_read', {
          chatRoomId: chatId,
          userId: this.currentUserId,
        });
        this.chat = chat;
        this.source = chat.isRoomSide;
        console.log(chat.messageResponse);
        if (!chat.isGroup) {
          const otherUser = chat.participantsResponse.find(
            (p) => p.commonUserId !== this.currentUserId
          );
          if (otherUser) {
            this.selectedChatName = otherUser.name;
            this.selectedChatimage =
              otherUser.profilePicture ||
              'assets/images/png-img/default-profile.png';
            this.otherParticipant = otherUser;
          }
        } else {
          this.selectedChatName = chat.roomName;
          this.selectedChatimage =
            chat.profilePicture ||
            'assets/images/png-img/default-group-profile.png';

          this.otherParticipants = chat.participantsResponse.filter(
            (p) => p.commonUserId !== this.currentUserId
          );
        }

        this.groupMessages(chat.messageResponse || []);
        setTimeout(() => this.scrollToBottom(), 60);
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  getSenderImage(senderId: number): string {
    const p = this.chat?.participantsResponse?.find(
      (u) => u.commonUserId === senderId
    );
    return p?.profilePicture || 'assets/images/svg-img/Avatar.svg';
  }

  groupMessages(messages: ChatMessageResponse[]) {
    if (!messages || messages.length === 0) {
      this.groupedMessages = [];
      return;
    }
    const map = new Map<number, ChatMessageResponse>();
    messages.forEach((m) => map.set(m.id, m));

    // Attach replyTo object
    messages.forEach((m) => {
      if (m.replyToId && m.replyToId > 0) {
        m.replyTo = map.get(m.replyToId);
        console.log(m.replyTo);
      }
    });
    console.log(messages);

    // 🔥 Step 1: Sort messages by date (ASC)
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );

    // 🔥 Step 2: Group by date label
    const groups: any = {};
    sortedMessages.forEach((msg) => {
      const date = new Date(msg.sentAt);
      const label = this.getDateLabel(date);

      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });

    // 🔥 Step 3: Convert to array (in correct order)
    this.groupedMessages = Object.keys(groups).map((label) => ({
      dateLabel: label,
      messages: groups[label],
    }));

    console.log(this.groupedMessages);
  }

  getDateLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getLastSeen(lastLogin: string | null): string {
    if (!lastLogin) return 'last seen recently';

    const last = new Date(lastLogin);
    const now = new Date();

    const diffMs = now.getTime() - last.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'online';
    if (diffMin < 60) return `last seen ${diffMin} minutes ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `last seen ${diffHr} hours ago`;

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (last.toDateString() === yesterday.toDateString()) {
      return (
        'last seen yesterday at ' +
        last.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    }

    return (
      'last seen on ' +
      last.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
      ' at ' +
      last.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  }

  uploadImage(event: any) {
    const files: File[] = Array.from((event.target.files as FileList) || []);
    if (!files.length) return;

    this.imageShow = true;

    files.forEach((file) => {
      this.rawFiles.push(file);

      if (file.type.startsWith('image/')) {
        // image preview via FileReader
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.images.push({
            type: 'IMAGE',
            url: e.target.result,
            name: file.name,
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        // video preview via blob URL (fast)
        const url = URL.createObjectURL(file);
        this.images.push({ type: 'VIDEO', url, name: file.name });
      } else if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        this.images.push({ type: 'AUDIO', url, name: file.name });
      } else {
        this.images.push({
          type: 'DOCUMENT',
          url: 'assets/images/svg-img/doc-file.svg',
          name: file.name,
        });
      }
    });
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(url: string, event: Event) {
    event.stopPropagation();

    const idx = this.images.findIndex((i) => i.url === url);
    if (idx === -1) return;

    const removed = this.images.splice(idx, 1)[0];
    if (
      (removed.type === 'VIDEO' || removed.type === 'AUDIO') &&
      removed.url.startsWith('blob:')
    ) {
      try {
        URL.revokeObjectURL(removed.url);
      } catch (e) {
        /*ignore*/
      }
    }

    const rfIndex = this.rawFiles.findIndex((f) => f.name === removed.name);
    if (rfIndex !== -1) this.rawFiles.splice(rfIndex, 1);

    if (this.images.length === 0) this.imageShow = false;
  }

  sendMessage(formData: ChatMessageResponse) {
    console.log(formData);

    this.socket.emit('get_message', formData);

    // setTimeout(() => {
    //   this.selectChat(formData.chatRoomId.toString());
    // }, 500);
  }

  // backend uses this
  isEdit: boolean = false;
  editId: number = 0;

  reply(message: ChatMessageResponse) {
    if (!message) return;
    console.log(message);

    this.replyingTo = message; // UI reply preview
    this.replyId = message.id; // backend needs only ID

    this.showReplyBox = true;
  }

  /* ============================================================
   CANCEL REPLY
   ============================================================ */
  cancelReply() {
    this.replyingTo = null;
    this.replyId = 0;
    this.showReplyBox = false;
  }

  /* ============================================================
   EDIT MODE
   ============================================================ */
  editMode(id: number, text: string) {
    this.isEdit = true;
    this.editId = id;
    this.messageText = text;
  }
  isSending = false;
  async send() {
    if (this.isSending) return; // Prevent double click
    this.isSending = true;
    if (this.messageText.trim() === '' && this.rawFiles.length === 0) return;

    if (this.isEdit && this.editId > 0) {
      this.serv.editMessage(this.editId, this.messageText).subscribe({
        next: (updatedMessages: ChatMessageResponse[]) => {
          this.chat.messageResponse = updatedMessages;
          this.groupMessages(updatedMessages || []);
          console.log(updatedMessages);
          this.isEdit = false;
          this.editId = 0;
          this.clearChatBox();
        },
        error: (err) => {
          console.error(err);
          this.isEdit = false;
          this.editId = 0;
        },
      });
      this.isSending = false;
      return;
    }

    const receiverList: number[] = this.chat.isGroup
      ? this.otherParticipants.map((p) => p.commonUserId)
      : [this.otherParticipant!.commonUserId];

    let payload: any = {
      senderId: this.currentUserId,
      receiverId: receiverList,
      chatRoomId: this.chat.id,
      content: this.messageText || '',
    };

    if (this.replyId > 0 && this.replyingTo) {
      payload.replyToId = this.replyingTo.id;
    }

    this.replyId = 0;
    this.replyingTo = null;
    this.showReplyBox = false;

    if (this.rawFiles.length === 0) {
      payload.messageType = 'TEXT';
      this.sendMessage(payload);
      this.clearChatBox();
      this.isSending = false;
      return;
    }
    const first = this.rawFiles[0];
    if (first.type.startsWith('image')) payload.messageType = 'IMAGE';
    else if (first.type.startsWith('video')) payload.messageType = 'VIDEO';
    else if (first.type.startsWith('audio')) payload.messageType = 'AUDIO';
    else payload.messageType = 'FILE';
    const uploadedUrls: string[] = [];

    for (let f of this.rawFiles) {
      try {
        const url = await this.cloudinary.uploadFile(f);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    payload.urls = uploadedUrls;

    this.sendMessage(payload);

    this.clearChatBox();
    this.isSending = false;
  }

  /* ============================================================
   CLEAR INPUT BOX
   ============================================================ */
  clearChatBox() {
    this.messageText = '';
    this.rawFiles = [];
    this.replyId = 0;
    this.replyingTo = null;
    this.showReplyBox = false;
    this.isEdit = false;
    this.editId = 0;
    this.images = [];
  }

  deleteMessage(id: number) {
    if (id < 1) {
      console.log('=====');
      return;
    }
    console.log(id);

    this.serv.deleteMessage(id).subscribe({
      next: (data: ChatMessageResponse[]) => {
        console.log(data);
        this.groupMessages(data || []);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  // ====================================================================
  // MESSAGE DROPDOWN (three dots)
  // ====================================================================
  toggleDropdown(event: MouseEvent, msgId: number) {
    event.stopPropagation();
    this.showDropdown = this.showDropdown === msgId ? null : msgId;
  }

  closeDropdown() {
    this.showDropdown = null;
  }

  @HostListener('document:click', ['$event'])
  outsideClick(event: MouseEvent) {
    const inside = (event.target as HTMLElement).closest('.message_sender');
    if (!inside) this.closeDropdown();
  }

  openSidebar(event: MouseEvent) {
    event.stopPropagation();
    this.toggleSidebar();
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  closeChatBox() {
    this.location.back();
    // existing behaviour (DOM manipulation kept as before)
    // document.getElementById('chatlistbox')?.classList.add('show-chat-box');
    // document.getElementById('chatlistbox')?.classList.remove('hide-chat-box');
    // document.getElementById('chatbox_section')?.classList.add('hide-chat-box');
    // document
    //   .getElementById('chatbox_section')
    //   ?.classList.remove('show-chat-box');
  }

  handleClick(event: MouseEvent) {
    const sidebar = document.querySelector('.sidebar-menu');
    const clickedInsideSidebar = sidebar?.contains(event.target as Node);
    if (!clickedInsideSidebar) {
      // keep sidebar open logic as before or close if desired
    }
  }

  // Close sidebar
  closeSidebar() {
    this.isSidebarVisible = false;
  }

  @HostListener('document:click', ['$event'])
  handleOutside(event: MouseEvent) {
    const sidebar = (event.target as HTMLElement).closest('.sidebar-menu');
    if (!sidebar && this.isSidebarVisible) {
      this.isSidebarVisible = false;
    }
  }

  showAddMemberModal: boolean = false;
  searchText: string = '';
  allUsers: ChatUserResponseDto[] = [];
  filteredUsers: ChatUserResponseDto[] = [];
  selectedUsers: ChatUserResponseDto[] = [];
  openAddMember() {
    if (this.currentUserId < 1) {
      return;
    }
    this.showAddMemberModal = true;
    // this.userServ.getUsersForNewChat(this.currentUserId).subscribe({
    //   next: (res) => {
    //     const existingIds = this.chat.participantsResponse.map(
    //       (u) => u.commonUserId
    //     );
    //     this.allUsers = res.filter((u: any) => !existingIds.includes(u.id));
    //     this.filteredUsers = [...this.allUsers];
    //   },
    // });

    const apiCall$ = this.source
      ? this.userServ.getUsersForNewChatForRoom(this.currentUserId)
      : this.userServ.getUsersForNewChat(this.currentUserId);

    apiCall$.subscribe({
      next: (res: ChatUserResponseDto[]) => {
        const existingIds = this.chat.participantsResponse.map(
          (u) => u.commonUserId
        );
        this.allUsers = res.filter((u: any) => !existingIds.includes(u.id));
        this.filteredUsers = [...this.allUsers];
      },
      error: (err) => {
        console.error('Failed to load users for new chat:', err);
      },
    });
  }

  closeAddMember() {
    this.showAddMemberModal = false;
    this.searchText = '';
  }
  searchUsers() {
    const search = this.searchText.toLowerCase();
    this.filteredUsers = this.allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
    );
  }

  isSelected(userId: number): boolean {
    return this.selectedUsers?.some((u) => u.commonUserId === userId) ?? false;
  }

  toggleSelectUser(user: any) {
    const index = this.selectedUsers.findIndex(
      (u) => u.commonUserId === user.commonUserId
    );

    if (index > -1) {
      // remove if already selected
      this.selectedUsers.splice(index, 1);
    } else {
      // add user
      this.selectedUsers.push(user);
    }
  }
  confirmAddMembers() {
    if (this.selectedUsers.length === 0) return;
    console.log(this.selectedUsers);

    const userIds = this.selectedUsers.map((u) => u.commonUserId);
    this.serv.addMembersToGroup(this.chat.id, userIds).subscribe({
      next: (res) => {
        this.chat = res;

        this.otherParticipants = res.participantsResponse.filter(
          (p) => p.commonUserId !== this.currentUserId
        );

        this.closeAddMember();
        this.selectedUsers = []; // reset selection
      },
      error: (err) => console.error(err),
    });
  }

  async updateGroupPhoto(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await this.cloudinary.uploadFile(file);

      if (this.chat.isGroup) {
        this.serv.updateGroupPhoto(this.chat.id, uploadedUrl).subscribe({
          next: (res) => {
            this.chat = res;
            this.selectedChatName = res.roomName;
            this.selectedChatimage =
              res.profilePicture ||
              'assets/images/png-img/default-group-profile.png';

            this.otherParticipants = res.participantsResponse.filter(
              (p) => p.commonUserId !== this.currentUserId
            );
            this.groupMessages(res.messageResponse || []);
            setTimeout(() => this.scrollToBottom(), 60);
          },
          error: (err) => console.error(err),
        });
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
    }
  }
  getFileName(url: string): string {
    return url.split('/').pop() || 'File';
  }
  getSafeFileUrl(url: string): string {
    if (url.toLowerCase().endsWith('.pdf')) {
      return url.replace('/image/upload/', '/raw/upload/');
    }
    return url;
  }
}