import { Component } from '@angular/core';
import { EmailsComponent } from "./emails/emails.component";
import { CandidatesComponent } from "./candidates/candidates.component";
import { CalendarComponent } from "../../../reusable-components/calendar/calendar.component";
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListComponent } from "../../../customer-portal/lead/component/list/list.component";
import { Router, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [EmailsComponent, CandidatesComponent, CalendarComponent, CommonModule, FormsModule, RouterOutlet],
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  isChatPopupOpen: boolean = false;

  // activeTab: 'individual' | 'group' = 'individual'; // Default to individual chats tab
  // isChatPopupOpen: boolean = false;
  // isChatBoxVisible: boolean = false;
  // selectedChat: string | null = null;
  // selectedChatName: string | null = null;
  // selectedChatimage: string | null = null;
  // showNewChatInput: boolean = false;
  // showGroupChatInput: boolean = false;
  // hidechat: boolean = true; // New state to show/hide new chat input
  // isImage: boolean = false;
  // imageShow: boolean = false;
  // // componenetRoutes = ComponentsRoutes;

  // images: any[] = [];
  // selectedImage: string | null = null; // Ensure this line is present

  // individualChats = [
  //   {
  //     id: 'Srasti Dubey',
  //     name: 'Srasti Dubey',
  //     lastMessage: 'Ok, see you later',
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat.svg',
  //   },
  //   {
  //     id: 'Rashmi Rajput',
  //     name: 'Rashmi Rajput',
  //     lastMessage: "You: I don't remember anything 😄",
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat.svg',
  //   },
  //   {
  //     id: 'Yash jain',
  //     name: 'Yash jain',
  //     lastMessage: 'Ok, see you later',
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat-2.svg',
  //   },
  //   {
  //     id: 'Hritik Gupta',
  //     name: 'Hritik Gupta',
  //     lastMessage: "You: I don't remember anything 😄",
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat-2.svg',
  //   },
  //   {
  //     id: 'Labhansh Gupta',
  //     name: 'Labhansh Gupta',
  //     lastMessage: 'Ok, see you later',
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat-2.svg',
  //   },
  //   {
  //     id: 'David Moore',
  //     name: 'David Moore',
  //     lastMessage: "You: I don't remember anything 😄",
  //     time: '18:30',
  //     unread: 2,
  //     image: 'assets/images/svg-img/Avatar-chat-2.svg',
  //   },
  // ];

  // groupChats = [
  //   {
  //     id: 'group1',
  //     name: 'E-candidate project',
  //     lastMessage: 'You: i dont remember anything 😄 ',
  //     time: '18:30',
  //     unread: 3,
  //     image: 'assets/images/svg-img/groupAvatar.svg',

  //   },
  //   {
  //     id: 'group2',
  //     name: 'Indore Management',
  //     lastMessage: 'Weekly sync-up',
  //     time: '18:30',
  //     unread: 5,
  //     image: 'assets/images/svg-img/Avatar-chat-2.svg',
  //   },
  //   {
  //     id: 'group3',
  //     name: 'E-candidate project',
  //     lastMessage: 'You: i dont remember anything 😄 ',
  //     time: '18:30',
  //     unread: 3,
  //     image: 'assets/images/svg-img/groupAvatar.svg',
  //   },
  //   {
  //     id: 'group4',
  //     name: 'Indore Management',
  //     lastMessage: 'Weekly sync-up',
  //     time: '18:30',
  //     unread: 5,
  //     image: 'assets/images/svg-img/groupAvatar.svg',
  //   },
  //   {
  //     id: 'group5',
  //     name: 'E-candidate project',
  //     lastMessage: 'You: i dont remember anything 😄 ',
  //     time: '18:30',
  //     unread: 3,
  //     image: 'assets/images/svg-img/groupAvatar.svg',
  //   },
  //   {
  //     id: 'group6',
  //     name: 'Indore Management',
  //     lastMessage: 'Weekly sync-up',
  //     time: '18:30',
  //     unread: 5,
  //     image: 'assets/images/svg-img/groupAvatar.svg',
  //   },
  // ];
constructor(private location : Location , private router : Router){}
  openForm() {
    this.isChatPopupOpen = true;
  }

  closeForm() {
    console.log('====');

    this.isChatPopupOpen = false;
 this.router.navigate(['agency/dash/chat']);
  }

  // selectChat(chatId: string) {
  //   this.selectedChat = chatId;
  //   this.isChatPopupOpen = true;
  //   this.isChatBoxVisible = true;

  //   const individualChat = this.individualChats.find(
  //     (chat) => chat.id === chatId
  //   );
  //   if (individualChat) {
  //     this.selectedChatName = individualChat.name;
  //     this.selectedChatimage = individualChat.image;
  //   } else {
  //     const groupChat = this.groupChats.find((chat) => chat.id === chatId);
  //     if (groupChat) {
  //       this.selectedChatName = groupChat.name;
  //       this.selectedChatimage = groupChat.image;
  //     }
  //   }
  // }

  // closeChatBox() {
  //   this.isChatBoxVisible = false;
  // }

  // // Function to switch tabs
  // switchTab(tab: 'individual' | 'group') {
  //   this.activeTab = tab;
  // }

  // // New method to handle "New Chat" click
  // showNewChat() {
  //   this.showNewChatInput = true;
  //   this.hidechat = false;
  //   this. showGroupChatInput = false;
  // }

  //  // New method to handle "Group Chat" click
  // showGroupChat() {
  //   this.showGroupChatInput = true;
  //   this.hidechat = false;

  // }
  // // Function to create a new chat
  // createNewChat(chatName: string) {
  //   if (this.activeTab === 'individual') {
  //     const newChat = {
  //       id: chatName.trim(),
  //       name: chatName.trim(),
  //       lastMessage: '',
  //       time: '',
  //       unread: 0,
  //       image: '',
  //     };
  //     this.individualChats.push(newChat);
  //   } else if (this.activeTab === 'group') {
  //     const newChat = {
  //       id: chatName.trim(),
  //       name: chatName.trim(),
  //       lastMessage: '',
  //       time: '',
  //       unread: 0,
  //       image: '',
  //     };
  //     this.groupChats.push(newChat);
  //   }
  //   this.showNewChatInput = false;
  //   this.activeTab = 'individual'; // Assuming you switch back to individual chats after creating
  // }
  // // New method to handle back arrow click
  // goBackToChatList() {
  //   this.showNewChatInput = false;
  //   this.hidechat = true;
  //   this. showGroupChatInput = false;
  // }

  // // image upload

  // uploadImage(event: any) {
  //   this.imageShow = true;
  //   const input = event.target as HTMLInputElement;

  //   if (input.files && input.files.length > 0) {
  //     for (let i = 0; i < input.files.length; i++) {
  //       const file = input.files[i];
  //       const reader = new FileReader();

  //       reader.onload = (e: ProgressEvent<FileReader>) => {
  //         this.images.push(e.target?.result as string);
  //       };

  //       reader.readAsDataURL(file);
  //     }
  //   }
  // }

  // removeImage(url: string, event: Event) {
  //   event.stopPropagation();
  //   this.images = this.images.filter((image) => image !== url);

  //   if (this.selectedImage === url) {
  //     this.selectedImage = null;
  //   }
  //   if (this.images.length === 0) {
  //     this.imageShow = false;
  //   }
  // }
  showDots: boolean = false;
  showDropdown: boolean = false;

  // toggleDropdown(event: MouseEvent) {
  //   event.stopPropagation(); // Prevent the click event from bubbling up
  //   this.showDropdown = !this.showDropdown;
  //   this.showDots = true; // Keep dots visible when dropdown is toggled
  // }
}
