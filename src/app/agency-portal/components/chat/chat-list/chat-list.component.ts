import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './../../../../auth/services/auth.service';
import {
  ChatUserResponseDto,
  ChatUserType,
  UserResponse,
  UserRole,
} from '../../../interfaces/user-request';
import { Modal } from 'bootstrap';
import * as bootstrap from 'bootstrap';
import { ChatServicesService } from '../../../services/chat-service/chat-services.service';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import { UserService } from '../../../services/user-service/user.service';
import { Router, RouterLink } from '@angular/router';
import { SocketService } from '../../../../socket-services/socket.service';
import { FormsModule } from '@angular/forms';
import { CustomerRolePipe } from '../../../../customer-portal/Pipe/customer-role.pipe';
export interface ChatRoomResponse {
  id: number;
  roomName: string;
  profilePicture?: string;
  participantsResponse: ChatUserResponseDto[];
  adminsResponse: ChatUserResponseDto[]; // 👈 NEW (Admin list)
  createdBy: ChatUserResponseDto; // 👈 NEW (Group creator)
  messageResponse: ChatMessageResponse[];
  isGroup: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number; // 👈 NEW (Unread messages)
  isRoomSide: boolean;
}

export interface ChatMessageResponse {
  id: number;
  chatRoomId: number;
  chatRoomName: string;
  senderId: number;
  senderEmail: string;
  receiverId: number[];
  receiverEmail: string[];
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'TEXT_WITH_FILE' | 'AUDIO';
  content: string;
  urls: string[];
  sentAt: string;
  updatedAt: string;
  edited: boolean;
  deleted: boolean;
  isread: boolean;
  delivered: boolean;

  replyToId?: number | null;

  // ⭐ ADD THIS - frontend will fill
  replyTo?: ChatMessageResponse | null;
}

@Component({
  selector: 'app-chat-list',
  // standalone: true,
  imports: [CommonModule, FormsModule, RouterLink,CustomerRolePipe],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css'],
})
export class ChatListComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private chatService: ChatServicesService,
    private auth: AuthService,
    private socket: SocketService,
    private userServ: UserService,
    private cloudinary: CloudinaryService
  ) { }
  isRoomOpen: boolean = false;
  @Input() source: boolean = false;
  activeTab: 'individual' | 'group' = 'individual';

  // UI
  hidechat = true;
  showNewChatInput = false;
  showGroupChatInput = false;

  // Dynamic Data
  individualChats: ChatRoomResponse[] = [];
  groupChats: ChatRoomResponse[] = [];
  currentUser: ChatUserResponseDto | null = null;
  loading: boolean = true;

  ngOnInit() {
    this.loadUser();
  }
  listen = false;
  loadUser() {
    this.chatService.getCurrentUser().subscribe({
      next: (res: ChatUserResponseDto) => {
        console.log(res);
        this.currentUser = res;
        console.log(this.currentUser);
        this.loading = false;
        console.log(this.currentUser);
        if (!this.socket.isConnected) {
          this.socket.connect(res.email);
        }
        // this.socket.connect(this.currentUser.email);
        console.log(this.currentUser);

        this.loadUsersChatsrooms(this.currentUser.commonUserId);
        console.log(this.currentUser);
        if (!this.listen) this.listenForIncomingMsg();
      },
      error: (err) => {
        this.loading = false;

        if (err.status === 401) {
          // this.error = "Session expired. Please login again.";
          console.log('Session expired. Please login again.');
        } else {
          console.log('Unable to load profile.');
        }
        console.log(err);
        this.router.navigate(['/auth/login']);
        this.currentUser = null;
      },
    });
  }
  // 🔹 Fetch Individual & Group Chats
  loadUsersChatsrooms(id: number) {
    console.log(this.currentUser);

    if (!this.currentUser) {
      return;
    }
    console.log(this.currentUser);
    this.chatService.getChatRoomByUser(id, this.source).subscribe({
      next: (res: ChatRoomResponse[]) => {
        console.log('Raw Chat Rooms:', res);

        // 🔥 Add unreadCount (ONLY received messages)
        const chatsWithUnread = res.map((chat) => ({
          ...chat,
          unreadCount: Array.isArray(chat.messageResponse)
            ? chat.messageResponse.filter(
              (m) =>
                !m.isread && m.senderId !== this.currentUser!.commonUserId // ✅ IMPORTANT
            ).length
            : 0,
        }));

        // 🔥 Split chats
        let individual = chatsWithUnread.filter((c) => !c.isGroup);
        let groups = chatsWithUnread.filter((c) => c.isGroup);

        // 🔥 Set roomName & profile picture for individual chats
        individual.forEach((chat) => {
          const otherUser = chat.participantsResponse?.find(
            (u) => u.commonUserId !== this.currentUser!.commonUserId
          );
          if (otherUser) {
            chat.roomName = otherUser.name;
            chat.profilePicture = otherUser.profilePicture;
          }
        });

        // 🔥 Sort by latest message
        this.individualChats = this.sortByLatest(individual);
        this.groupChats = this.sortByLatest(groups);

        // 🔥 Copy for search
        this.filteredIndividualChats = [...this.individualChats];
        this.filteredGroupChats = [...this.groupChats];
      },
      error: (err) => {
        console.error('Error loading chat rooms:', err);
      },
    });
  }

  listenForIncomingMsg() {
    this.listen = true;
    // this.socket.off('read_update')
    // 🔹 When YOU send a message

    this.socket.on('sent_message', (data: ChatMessageResponse) => {
      console.log(data);
      this.refreshChats();
    });
    this.socket.abcCall$.subscribe(() => {
      console.log('1111111111111111111111111');
      this.refreshChats();
    });

    this.socket.on('receive_message', (msg: ChatMessageResponse) => {
      console.log(msg);
      console.log('jjjjjjjjjjjjjjjjjjjjjj');
      this.refreshChats();
      // this.socket.emit('message_delivered', msg.id);
    });
  }

  refreshChats() {
    if (!this.currentUser) return;
    this.loadUsersChatsrooms(this.currentUser.commonUserId);
  }

  searchText: string = '';

  filteredIndividualChats: ChatRoomResponse[] = [];
  filteredGroupChats: ChatRoomResponse[] = [];

  // ==============================
  // 🔍 SEARCH CHAT
  // ==============================
  searchChats() {
    const text = this.searchText.trim().toLowerCase();

    if (!text) {
      this.filteredIndividualChats = [...this.individualChats];
      this.filteredGroupChats = [...this.groupChats];
      return;
    }

    // 🔍 Group search
    this.filteredGroupChats = this.groupChats.filter((chat) =>
      chat.roomName?.toLowerCase().includes(text)
    );

    // 🔍 Individual search
    this.filteredIndividualChats = this.individualChats.filter((chat) => {
      const name = chat.roomName?.toLowerCase() || '';

      const lastMessage =
        chat.messageResponse?.length > 0
          ? chat.messageResponse[
            chat.messageResponse.length - 1
          ]?.content?.toLowerCase() || ''
          : '';

      return name.includes(text) || lastMessage.includes(text);
    });
  }

  // ==============================
  // 🔥 SORT BY LATEST MESSAGE
  // ==============================
  private sortByLatest(chats: ChatRoomResponse[]): ChatRoomResponse[] {
    return chats.sort((a, b) => {
      const aTime = this.getLastMessageTime(a);
      const bTime = this.getLastMessageTime(b);
      return bTime - aTime; // latest first
    });
  }

  private getLastMessageTime(chat: ChatRoomResponse): number {
    if (chat.messageResponse?.length) {
      const lastMsg = chat.messageResponse[chat.messageResponse.length - 1];
      return new Date(lastMsg.sentAt).getTime();
    }
    return new Date(chat.updatedAt).getTime();
  }
  // ==============================
  // 🔔 SOCKET NEW MESSAGE (OPTIONAL)
  // ==============================
  moveChatToTop(roomId: number) {
    const index = this.individualChats.findIndex((c) => c.id === roomId);
    if (index > -1) {
      const chat = this.individualChats.splice(index, 1)[0];
      this.individualChats.unshift(chat);
      this.filteredIndividualChats = [...this.individualChats];
    }
  }

  formatDate(sentAt: string): string {
    const msgDate = new Date(sentAt);
    const today = new Date();

    // Remove time for clean comparison
    const msgDay = new Date(
      msgDate.getFullYear(),
      msgDate.getMonth(),
      msgDate.getDate()
    );
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // 1) Check Today
    if (msgDay.getTime() === todayDay.getTime()) {
      return msgDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    // 2) Check Yesterday
    const yesterday = new Date(todayDay);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    // 3) Older date → DD Mon (5 Oct)
    return msgDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  }

  switchTab(tab: 'individual' | 'group') {
    this.activeTab = tab;
  }

  showNewChat() {
    this.showNewChatInput = true;
    this.hidechat = false;
    this.showGroupChatInput = false;
  }

  showGroupChat() {
    this.showGroupChatInput = true;
    this.hidechat = false;
  }

  goBackToChatList() {
    this.showNewChatInput = false;
    this.showGroupChatInput = false;
    this.hidechat = true;
  }

  usersforNewChat: ChatUserResponseDto[] = [];
  filteredUsers: ChatUserResponseDto[] = [];
  searchUser: string = '';

  getUsersForNewChat() {
    console.log(this.currentUser);

    if (!this.currentUser?.commonUserId) return;

    const apiCall$ = this.source
      ? this.userServ.getUsersForNewChatForRoom(this.currentUser.commonUserId)
      : this.userServ.getUsersForNewChat(this.currentUser.commonUserId);

    apiCall$.subscribe({
      next: (res: ChatUserResponseDto[]) => {
        console.log('Users for new chat:', res);

        this.usersforNewChat = res;
        this.filteredGroupUsers = [...res];
        this.filteredUsers = [...res];
      },
      error: (err) => {
        console.error('Failed to load users for new chat:', err);
      },
    });
  }

  filterUsers() {
    const query = this.searchUser.toLowerCase().trim();
    this.filteredUsers = this.usersforNewChat.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }

  startNewChat(user: ChatUserResponseDto) {
    console.log('Start chat with:', user);

    if (!this.currentUser) {
      console.error('Current user missing');
      return;
    }

    const senderId = this.currentUser.commonUserId;

    const receiverId = user.commonUserId;
    console.log(senderId, '  ', receiverId);

    // 1️⃣ Check if chat already exists
    this.chatService.checkChatRoom(senderId, receiverId).subscribe({
      next: (res) => {
        console.log(res);

        if (res.exists) {
          // 🔥 Existing chat — open it
          console.log('Opening existing chat:', res);
          // this.closeNewChatModal()
          this.loadUsersChatsrooms(senderId);
          // this.router.navigate(['home/chat/chat-box', res.roomId]);
          //  (document.getElementById("newchat") as any).style.display = "none";
          this.closeNewChatModal();
          return;
        }

        const payload = {
          roomName: null, // Auto name for 1-to-1 chat
          profilePicture: null,
          participantIds: [senderId, receiverId],
          createdBy: senderId,
          isGroup: false,
          isRoomSide: this.source,
        };

        console.log('Creating new chat:', payload);

        this.chatService.createChatRoom(payload).subscribe({
          next: (room) => {
            console.log('New chat created:', room);
            // Refresh chat list
            this.loadUsersChatsrooms(senderId);

            // Open the newly created chat
            // this.router.navigate(['home/chat/chat-box', res.roomId]);

            this.goBackToChatList();
            // this.closeNewChatModal();
            this.closeNewChatModal();
          },
          error: (err) => {
            console.error('Chat creation failed:', err);
          },
        });
        // this.closeNewChatModal();
      },
    });
  }

  groupName: string = '';
  groupImagePreview: string | null = null;
  groupImageUrl: string | null = null; // this goes to backend

  groupUserSearch: string = '';
  filteredGroupUsers: ChatUserResponseDto[] = [];

  selectedGroupMembers: number[] = [];

  filterGroupUsers() {
    const q = this.groupUserSearch.toLowerCase();
    this.filteredGroupUsers = this.usersforNewChat.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }

  toggleGroupMember(userId: number) {
    if (this.selectedGroupMembers.includes(userId)) {
      this.selectedGroupMembers = this.selectedGroupMembers.filter(
        (id) => id !== userId
      );
    } else {
      this.selectedGroupMembers.push(userId);
    }
  }

  isSelectedGroupMember(userId: number): boolean {
    return this.selectedGroupMembers.includes(userId);
  }

  async uploadGroupImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.groupImagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);

    try {
      const uploadedUrl = await this.cloudinary.uploadFile(file);
      this.groupImageUrl = uploadedUrl; // store actual cloudinary URL
      console.log('Group Image Uploaded:', uploadedUrl);
    } catch (error) {
      console.error('Cloudinary upload failed', error);
      this.groupImageUrl = 'assets/images/png-img/default-group-profile.png';
    }
  }

  createGroupChat() {
    console.log('Group Create Payload:');

    if (!this.currentUser) return;
    const payload = {
      roomName: this.groupName,
      profilePicture:
        this.groupImageUrl || 'assets/images/png-img/default-group-profile.png',
      participantIds: [
        ...this.selectedGroupMembers,
        this.currentUser.commonUserId,
      ],
      createdBy: this.currentUser.commonUserId,
      isGroup: true,
      isRoomSide: this.source,
    };

    console.log('Group Create Payload:', payload);

    this.chatService.createChatRoom(payload).subscribe({
      next: (room) => {
        console.log('Group created:', room);

        // this.router.navigate(['home/chat/chat-box', room.id]);

        this.groupName = '';
        this.groupImagePreview = null;
        this.selectedGroupMembers = [];
        this.closeGroupModal();
        // (document.getElementById("groupchat") as any).style.display = "none";
        if (this.currentUser)
          this.loadUsersChatsrooms(this.currentUser.commonUserId);
      },
      error: (err) => console.error('Group creation failed:', err),
    });
  }

  closeGroupModal() {
    const modalEl = document.getElementById('groupchat');
    if (!modalEl) return;

    // 1) Hide Modal
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';

    // 2) Backdrop Remove
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    // 3) Body class remove (VERY IMPORTANT)
    document.body.classList.remove('modal-open');

    // 4) Body style remove (bootstrap adds padding-right)
    document.body.style.removeProperty('padding-right');
  }
  closeNewChatModal() {
    const modalEl = document.getElementById('newchat');
    if (!modalEl) return;

    // 1) Hide Modal
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';

    // 2) Backdrop Remove
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    // 3) Body class remove (VERY IMPORTANT)
    document.body.classList.remove('modal-open');

    // 4) Body style remove (bootstrap adds padding-right)
    document.body.style.removeProperty('padding-right');
  }
  openNewChat() {
    this.getUsersForNewChat();

    setTimeout(() => {
      const modalEl = document.getElementById('newchat');
      if (modalEl) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 150);
  }

  openGroupChat() {
    this.getUsersForNewChat();

    setTimeout(() => {
      const modalEl = document.getElementById('groupchat');
      if (modalEl) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 150);
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}

// this.router.navigate(['/agency/chat', newChat.roomId]);