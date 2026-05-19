import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalenderComponent } from "../../../task-calender/component/calender/calender.component";
import { ListComponent } from '../../../lead/component/list/list.component';
import { TaskCalenderComponent } from '../../../task-calender/component/task-calender/task-calender.component';
import { TaskService } from '../../../services/task.service';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { Task } from '../../../models/Task.model';
import { AllEvents } from '../../../models/AllEvents.model';
import { Router, RouterOutlet } from "@angular/router";
import { CalendarComponent } from "../../../agencyroom/component/calendar/calendar.component";
import { EmailsComponent } from '../../../../agency-portal/components/dashboard/emails/emails.component';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ListComponent, CalenderComponent, RouterOutlet, EmailsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(CalenderComponent) calendarComponent!: CalenderComponent;

  // Calendar data
  calendarEvents: any[] = [];
  createdTasks: Task[] = [];
  createdEvents: AllEvents[] = [];
  private currentUserRole: string | null = null;
  private currentCustomerUserId: number | null = null;
  private currentBranchUserId: number | null = null;

  searchText: string = '';
  filteredItems: any[] = [];
  candidates = [
    { name: 'Olivia Rhye', role: 'UI UX designer', avatar: 'assets/images/svg-img/candidate-Avatar.svg' },
    { name: 'John Doe', role: 'Frontend Developer', avatar: 'assets/images/svg-img/candidate-Avatar.svg' },
    { name: 'Sophia Lee', role: 'Backend Developer', avatar: 'assets/images/svg-img/candidate-Avatar.svg' }
  ];

  emails = [
    { sender: 'E-candidate', message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...', avatar: 'assets/images/svg-img/user-icon.svg' },
    { sender: 'Riya Sharma', message: 'Your interview is scheduled for 3 PM today.', avatar: '' },
    { sender: 'Tech HR', message: 'Please update your resume in our system.', avatar: 'assets/images/svg-img/user-icon.svg' }
  ];

  chatUsers = [
    { name: 'Jessica Drew', lastMessage: 'Ok, see you later', avatar: 'assets/images/svg-img/Avatar-chat.svg', time: '18:30', unread: 2 },
    { name: 'David Moore', lastMessage: "You: I don't remember anything 😄", avatar: 'assets/images/svg-img/Avatar-chat-2.svg', time: '18:30', unread: 1 },
  ];

  chatMessages = [
    { sender: 'other', name: 'David Moore', text: 'omg, this is amazing', time: '11:10am' },
    { sender: 'me', text: 'How are you?', time: '11:11am' },
  ];
  items = [
    { name: 'John Doe', role: 'Admin' },
    { name: 'Jane Smith', role: 'CSR' },
    { name: 'Michael Johnson', role: 'Customer' },
    { name: 'Emily Davis', role: 'CSR' }
  ];

  currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  currentDay = 'Today';
  selectedView = 'Month';
  isChatOpen = false;
  newMessage = '';
  chatSearch = '';

  private socketSub?: Subscription;
  constructor(
    private taskService: TaskService,
    private eventService: EventService,
    private authService: AuthService,
    private router: Router,
    private notificationSocket: NotificationSocketService
  ) { }

  ngOnInit(): void {
    this.filteredItems = this.items;
    this.fetchCurrentUserContext(() => {
      this.loadAllData();
      this.listenForAssignments();
    });
  }

  ngAfterViewInit(): void {
    if (this.calendarEvents.length && this.calendarComponent) {
      this.calendarComponent.reloadCalendarEvents(this.calendarEvents);
    }
  }

  private fetchCurrentUserContext(done: () => void) {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        const role = user?.role || user?.roles?.[0] || null;
        this.currentUserRole = role;

        // 🔥 BRANCH USERS
        if (role === 'BRANCH_ADMIN' || role === 'BRANCH_TEAM_MEMBER') {
          this.currentBranchUserId = Number(user.id);
          localStorage.setItem('branchUserId', String(user.id));

          // Branch users ke liye customerUserId bhi set karo agar available ho
          const customerUserId = user.customerUserId || user.customer?.id;
          if (customerUserId) {
            this.currentCustomerUserId = Number(customerUserId);
            localStorage.setItem('customerUserId', String(customerUserId));
          } else {
            // Agar customerUserId nahi hai, to user.id use karo
            this.currentCustomerUserId = Number(user.id);
            localStorage.setItem('customerUserId', String(user.id));
          }
        }

        // CUSTOMER USERS
        if (role === 'CUSTOMER_TEAM_MEMBER') {
          this.currentCustomerUserId = Number(user.id);
          localStorage.setItem('customerUserId', String(user.id));
        }

        if (role === 'CUSTOMER_ADMIN') {
          const customerUserId = user.customerUserId || user.customer?.id || user.id;
          if (customerUserId) {
            this.currentCustomerUserId = Number(customerUserId);
            localStorage.setItem('customerUserId', String(customerUserId));
          }
        }

        localStorage.setItem('role', role ?? '');
        done();
      },
      error: () => done(),
    });
  }

  private getRole(): string | null {
    return this.currentUserRole ?? localStorage.getItem('role');
  }

  private getCustomerUserId(): number | null {
    return this.currentCustomerUserId ?? Number(localStorage.getItem('customerUserId'));
  }

  private getBranchUserId(): number | null {
    return this.currentBranchUserId ?? Number(localStorage.getItem('branchUserId'));
  }

  loadAllData(): void {
    const role = this.getRole();
    const customerUserId = this.getCustomerUserId();
    const branchUserId = this.getBranchUserId();

    if (!role) return;

    // Branch user ke liye different API endpoints
    const isBranchUser = role === 'BRANCH_TEAM_MEMBER' || role === 'BRANCH_ADMIN';

    if (isBranchUser && !branchUserId) {
      console.warn('❌ branchUserId missing for branch user');
      return;
    }

    if (!isBranchUser && !customerUserId) {
      console.warn('❌ customerUserId missing for customer user');
      return;
    }

    const taskRequests$ = isBranchUser
      ? forkJoin({
        assigned: this.taskService.getTasksByAssignedBranchUser(branchUserId!),
        created: this.taskService.getTasksCreatedByBranchUser(branchUserId!),
      })
      : forkJoin({
        assigned: this.taskService.getTasksByCustomerUser(customerUserId!),
        created: this.taskService.getTasksCreatedByCustomer(customerUserId!),  
        
      });

    // 🔥 BRANCH USERS: Use specific branch event endpoints
    const eventRequest$: Observable<AllEvents[]> = isBranchUser
      ? forkJoin({
        assigned: this.eventService.getEventsAssignedToBranchUser(branchUserId!),
        created: this.eventService.getEventsCreatedByBranchUser(branchUserId!),
      }).pipe(
        map(({ assigned, created }) => [...assigned, ...created])
      )
      : this.eventService.getAllEvents();

    forkJoin({ tasks: taskRequests$, events: eventRequest$ }).subscribe({
      next: ({ tasks, events }) => {
        // Combine created + assigned tasks (remove duplicates by id)
        // 🔥 Filter out tasks with agencyId - dashboard should only show customer's own tasks
        const allTasks = [...(tasks.created ?? []), ...(tasks.assigned ?? [])]
          .filter((t) => t.agencyId == null); // Only show tasks without agencyId

        const uniqueTaskIds = new Set<number>();
        this.createdTasks = allTasks.filter((t) => {
          if (t.id && !uniqueTaskIds.has(t.id)) {
            uniqueTaskIds.add(t.id);
            return true;
          }
          return false;
        });

        // 🔥 Filter events based on user role
        if (isBranchUser) {
          // Branch users: Show events created by OR assigned to branch user
          const uniqueEventIds = new Set<number>();
          this.createdEvents = (events || []).filter((event) => {
            if (event.id && uniqueEventIds.has(event.id)) {
              return false; // Skip duplicates
            }
            if (event.id) {
              uniqueEventIds.add(event.id);
            }

            const isBranchUserEvent =
              event.createdByBranchUserId === branchUserId ||
              event.assignedBranchUserId === branchUserId;
            const hasNoAgencyId = event.agencyId == null; // Only show events without agencyId
            return isBranchUserEvent && hasNoAgencyId;
          });
        } else {
          // Customer users: Show events created by OR assigned to customer user
          this.createdEvents = (events || []).filter((event) => {
            const isUserEvent = event.createdByCustomerUserId === customerUserId ||
              event.assignedCustomerUserId === customerUserId;
            const hasNoAgencyId = event.agencyId == null; // Only show events without agencyId
            return isUserEvent && hasNoAgencyId;
          });
        }

        this.refreshCalendarEvents();
      },
      error: (err) => console.error('Data load error', err),
    });
  }

  private refreshCalendarEvents(): void {
    const role = this.getRole();
    const customerUserId = this.getCustomerUserId();
    const branchUserId = this.getBranchUserId();
    const isBranchUser = role === 'BRANCH_TEAM_MEMBER' || role === 'BRANCH_ADMIN';

    const taskEvents = this.createdTasks?.map((t) => {
      const isAssigned = isBranchUser
        ? t.assignedBranchUserId === branchUserId
        : t.assignedCustomerUserId === customerUserId;
      return {
        id: t.id,
        title: t.title,
        start: t.startTime
          ? new Date(`${t.startDate}T${t.startTime}`)
          : new Date(`${t.startDate}T00:00`),
        end: t.endTime
          ? new Date(`${t.endDate}T${t.endTime}`)
          : new Date(`${t.endDate}T23:59`),
        type: isAssigned ? 'assigned-task' : 'task',
      };
    }) ?? [];

    const eventEvents = this.createdEvents?.map((e) => {
      const isAssigned = isBranchUser
        ? e.assignedBranchUserId === branchUserId
        : e.assignedCustomerUserId === customerUserId;
      return {
        id: e.id,
        title: e.title,
        start: e.startTime
          ? new Date(`${e.startDate}T${e.startTime}`)
          : new Date(`${e.startDate}T00:00`),
        end: e.endTime
          ? new Date(`${e.endDate}T${e.endTime}`)
          : new Date(`${e.endDate}T23:59`),
        type: isAssigned ? 'assigned-event' : 'event',
      };
    }) ?? [];

    this.calendarEvents = [...taskEvents, ...eventEvents];

    if (this.calendarComponent) {
      this.calendarComponent.reloadCalendarEvents(this.calendarEvents);
    }
  }
  get filteredChatUsers() {
    const search = this.chatSearch.toLowerCase();
    if (!search) return this.chatUsers;
    return this.chatUsers.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.lastMessage.toLowerCase().includes(search)
    );
  }
  // openForm() {
  //   this.isChatOpen = true;
  // }

  // closeForm() {
  //   this.isChatOpen = false;
  // }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatMessages.push({ sender: 'me', text: this.newMessage, time: 'Now' });
      this.newMessage = '';
    }
  }

  onCalendarViewChange(event: Event) {
    const view = (event.target as HTMLSelectElement).value;
    if (this.calendarComponent) {
      this.calendarComponent.changeView(view);
    }
  }






  showDots: boolean = false;
  showDropdown: boolean = false;
  isChatPopupOpen: boolean = false;

  openForm() {
    this.isChatPopupOpen = true;
  }

  closeForm() {
    console.log('====');

    this.isChatPopupOpen = false;
    this.router.navigate(['/home']);
  }
  private listenForAssignments(): void {
    this.socketSub = this.notificationSocket.notification$
      .subscribe(notification => {

        if (
          notification.entityType === 'TASK' ||
          notification.entityType === 'EVENT'
        ) {
          console.log('🔄 Assignment received, refreshing calendar');
          this.loadAllData(); 
        }
      });
  }

}
