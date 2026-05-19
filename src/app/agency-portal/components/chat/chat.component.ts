import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatBoxComponent } from "./chat-box/chat-box.component";
import { ChatListComponent } from './chat-list/chat-list.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [ChatListComponent, CommonModule, FormsModule,  RouterOutlet]
})
export class ChatComponent {

}
