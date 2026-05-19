import { Component, OnInit } from '@angular/core';
import { NotesComponent } from './notes/notes.component';
import { TasklistComponent } from './tasklist/tasklist.component';
import { ChatListComponent } from '../chat/chat-list/chat-list.component';
import { ChatBoxComponent } from '../chat/chat-box/chat-box.component';
import { ChatComponent } from '../chat/chat.component';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { JobpostComponent } from './jobpost/jobpost.component';
import { AgencyTaskCalendarComponent } from '../task-calendar/task-calendar.component';

@Component({
  selector: 'app-customer-room',
  imports: [NotesComponent,TasklistComponent,ChatListComponent,RouterOutlet,JobpostComponent,AgencyTaskCalendarComponent],
  templateUrl: './customer-room.component.html',
  styleUrl: './customer-room.component.css'
})
export class CustomerRoomComponent implements OnInit{
  customerUserId!: number;

  constructor(private route: ActivatedRoute) {}
  ngOnInit() {
    this.route.params.subscribe(p => {
      this.customerUserId = Number(p['customerId']); 
      console.log('👤 Customer User ID:', this.customerUserId);
    });
  }
}
