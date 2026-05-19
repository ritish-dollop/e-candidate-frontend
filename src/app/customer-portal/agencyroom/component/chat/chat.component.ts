import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TaskCalenderComponent } from '../../../task-calender/component/task-calender/task-calender.component';
import { RouterOutlet } from '@angular/router';
import { JobpostComponent } from '../jobpost/jobpost.component';
import { NotesComponent } from '../notes/notes.component';
import { TasklistComponent } from '../tasklist/tasklist.component';
import { ChatBoxComponent } from '../../../../agency-portal/components/chat/chat-box/chat-box.component';
import { ChatListComponent } from '../../../../agency-portal/components/chat/chat-list/chat-list.component';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [TaskCalenderComponent, CommonModule, FormsModule,JobpostComponent,NotesComponent,TasklistComponent,  FullCalendarModule,RouterOutlet,ChatListComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  @ViewChild(TaskCalenderComponent) taskCalendar?: TaskCalenderComponent;

  // TODO: replace with actual agency id from context/auth once available
  agencyId = 1;

  constructor() { }
  ngOnInit() {

  }
  onCalendarTabActivated() {
    // Tab visible hone ke baad thoda delay dekar calendar layout refresh aur data reload
    setTimeout(() => {
      if (this.taskCalendar) {
        console.log('📅 Calling loadAllData()...');
        this.taskCalendar.loadAllData();
        // Give time for data to load before refreshing layout
        setTimeout(() => {
          console.log('📅 Refreshing calendar layout...');
          this.taskCalendar?.refreshCalendarLayout();
        }, 500);
      } else {
        console.error('❌ taskCalendar component not found!');
      }
    }, 100);
  }

}
