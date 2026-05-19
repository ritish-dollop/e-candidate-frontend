import { Component, Input, OnInit, AfterViewInit, ViewChild, SimpleChanges, OnChanges, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { UserService } from '../../services/user-service/user.service';
import { UserResponse } from '../../interfaces/user-request';
import { CalenderComponent } from '../../../customer-portal/task-calender/component/calender/calender.component';
import { Task } from '../../../customer-portal/models/Task.model';
import { AllEvents } from '../../../customer-portal/models/AllEvents.model';
import { TaskService } from '../../../customer-portal/services/task.service';
import { EventService } from '../../../customer-portal/services/event.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationSocketService } from '../../../socket-services/notificationSocket.service';
import { CompanyuserService } from '../../../customer-portal/services/companyuser.service';
declare var bootstrap: any;

@Component({
  selector: 'app-agency-task-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, CalenderComponent],
  templateUrl: './task-calendar.component.html',
  styleUrls: ['./task-calendar.component.css'],
})
export class AgencyTaskCalendarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(CalenderComponent) calendar!: CalenderComponent;
  addModalId = 'agencyTaskCalendarAddModal';
  @Input() agencyId?: number;
  @Input() hideAddButton = false;

  @Input() openAddEventForm: boolean = false;
  openAddMeetingMode = false;
  @Input() defaultModalTab: 'task' | 'event' = 'task';

  @Input() customerRoomMode: boolean = false;
  @Input() customerUserId?: number;

  

  selectedView: string = 'dayGridMonth';

  activeTab: number = 1;
  modalActiveTab: 'task' | 'event' = 'task';
  activeInnerTab: 'task' | 'event' | '' = 'task';

  tasks: Task[] = [];
  events: AllEvents[] = [];
  assignedTasks: Task[] = [];
  createdTasks: Task[] = [];
  assignedEvents: AllEvents[] = [];
  createdEvents: AllEvents[] = [];
  customerUsers: any[] = [];


  private currentUserRole: string | null = null;
  private currentAgencyUserId: number | null = null;

  currentMonth: string = '';
  currentYear: number = 0;

  selectedEvent: any = null;
  editEventModel: any = {};

  selectedTask: Task | null = null;
  editTaskModel: any = {};

  calendarEvents: any[] = [];

  agencyUsers: any[] = [];
  private currentAgencyId: number | null = null;

  years: number[] = [];
  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  currentDayLabel: string = '';
  months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  newTask: any = {
    title: '',
    description: '',
    allDay: false,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    status: 'PENDING',
    assignedToId: null,
    agencyId: null,
  };

  newEvent: AllEvents = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    address: '',
    googleMeetLink: '',
    status: 'SCHEDULED',
    assignedUserId: null,
    assignedCustomerUserId: null,
    assignedBranchUserId: null,
    createdByUserId: null,
    createdByCustomerUserId: null,
    createdByBranchUserId: null
  };

  constructor(
    private router: Router,
    private taskService: TaskService,
    private eventService: EventService,
    private authService: AuthService,
    private userService: UserService,
    private notificationSocket: NotificationSocketService,
    private route: ActivatedRoute,
    private companyuserService: CompanyuserService
  ) { }

  ngOnInit(): void {
    const today = new Date();
    this.currentMonth = today.toLocaleString('en-US', { month: 'long' });
    this.currentYear = today.getFullYear();
  
    for (let y = 2000; y <= 2030; y++) {
      this.years.push(y);
    }
  
    // ✅ ONLY ONE TIME USER CONTEXT
    this.fetchCurrentUserContext(() => {
  
      const role = this.getRole();
  
      if (role?.startsWith('AGENCY')) {
        this.notificationSocket.connect('AGENCY_USER', this.currentAgencyUserId!);
      }
  
      if (this.customerRoomMode) {
        this.loadCustomerUsersForCustomer();   // 🔥 ONLY CUSTOMER USERS
      } else {
        this.loadAgencyUsers();     // normal agency flow
      }
      // ✅ VERY IMPORTANT
      // this.loadAgencyUsers();
      this.loadAllData();
    });
    this.notificationSocket.notification$.subscribe(n => {
      console.log('🔥 UI Notification:', n);
    
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: n.title,
        text: n.message,
        timer: 4000,
        showConfirmButton: false
      });
    
      if (
        n.type === 'TASK_ASSIGNED' ||
        n.type === 'EVENT_ASSIGNED'
      ) {
        // ✅ Force open Task & Event tab
        this.activeTab = 2;
    
        if (n.type === 'TASK_ASSIGNED') {
          this.activeInnerTab = 'task';
        }
    
        if (n.type === 'EVENT_ASSIGNED') {
          this.activeInnerTab = 'event';
        }
    
        // ✅ Reload assigned data
        this.loadAllData();
      }
    
      if (
        n.type === 'TASK_UPDATED' ||
        n.type === 'TASK_DELETED' ||
        n.type === 'TASK_COMPLETED' ||
        n.type === 'EVENT_UPDATED' ||
        n.type === 'EVENT_DELETED' ||
        n.type === 'EVENT_COMPLETED'
      ) {
        this.loadAllData();
      }
    });
    
  
    this.listenForTaskOrEventFromNotification();
  }
  

  ngAfterViewInit(): void {
    if (this.calendarEvents.length) {
      this.calendar.reloadCalendarEvents(this.calendarEvents);
    }
    const api = this.calendar.fullCalendar.getApi();
    this.updateDayLabel(api);
  }

  getRole(): string | null {
    const role = this.currentUserRole ?? localStorage.getItem('role');
    return this.normalizeRole(role);
  }
  

  // private getAgencyUserId(): number | null {
  //   return this.getRole()?.startsWith('AGENCY') ? Number(localStorage.getItem('userId')) : null;
  // }
  private getAgencyUserId(): number | null {
  return this.currentAgencyUserId;
}
loadCustomerUsersForCustomer() {

  const customerId = this.route.snapshot.params['customerId']; 
  // or pass from parent component

  if (!customerId) {
    console.error('❌ customerId missing for customer room');
    return;
  }

  this.companyuserService
    .getUsersByCustomerWithPagination(customerId, 0, 100)
    .subscribe({
      next: (res) => {
        this.customerUsers = (res.content || []).filter(
          (u: any) => u.status === 'ACTIVE'
        );
        console.log('✅ Customer Users Loaded:', this.customerUsers);
      },
      error: (err) => console.error('❌ customer users error', err)
    });
}




loadAgencyUsers() {
  const agencyIdToUse = this.agencyId || this.currentAgencyId;
  const currentUserId = this.getAgencyUserId();

  console.log('🔥 Loading users for agency:', agencyIdToUse);

  if (!agencyIdToUse) {
    console.error('❌ agencyId missing');
    return;
  }

  this.userService.getUsersByAgency(agencyIdToUse).subscribe({
    next: (users) => {
      console.log('✅ users from API:', users);

      this.agencyUsers = users.filter(
        (u: UserResponse) =>
          u.status === 'ACTIVE' && u.id !== currentUserId
      );
    },
    error: (err) => console.error('❌ Error loading agency users:', err),
  });
}


  private fetchCurrentUserContext(done: () => void) {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        const rawRole = user?.role || user?.roles || null;
const role = this.normalizeRole(rawRole);

this.currentUserRole = role;
  
        if (role?.startsWith('AGENCY')) {
          this.currentAgencyUserId = Number(user.id);
          this.currentAgencyId = user.agencyId;
  
          // if input agencyId not passed
          if (!this.agencyId && user.agencyId) {
            this.agencyId = user.agencyId;
          }
  
          // ✅ only agencyId here
          this.newTask.agencyId = this.agencyId;
        }
  
        localStorage.setItem('role', role ?? '');
        done();
      },
      error: () => done(),
    });
  }
  

  public loadAllData(): void {

    // ================= CUSTOMER ROOM MODE =================
    if (this.customerRoomMode && this.customerUserId) {
  
      forkJoin({
        tasks: this.taskService.getTasksByCustomerUser(this.customerUserId),
        events: this.eventService.getEventsByCustomerUser(this.customerUserId)
      }).subscribe({
        next: ({ tasks, events }) => {
  
          console.log('✅ Customer Tasks:', tasks);
          console.log('✅ Customer Events:', events);
  
          this.tasks = tasks || [];
          this.events = events || [];
  
          // calendar uses these
          this.createdTasks = this.tasks;
          this.createdEvents = this.events;
  
          this.refreshCalendarEvents();
        },
        error: err => console.error('❌ Customer calendar error', err)
      });
  
      return;
    }
  
    // ================= AGENCY MODE =================
  
    const role = this.getRole();
  
    const taskRequests$ = this.buildTaskRequests(role);
    const eventRequest$ = this.buildEventRequest();
  
    if (!role || !taskRequests$ || !eventRequest$) {
      console.warn('⚠️ Missing role or requests to load data');
      return;
    }
  
    forkJoin({ tasks: taskRequests$, events: eventRequest$ }).subscribe({
      next: ({ tasks, events }) => {
  
        const agencyUserId = Number(this.getAgencyUserId());
  
        this.assignedTasks = (tasks.assigned ?? []).filter(
          t => Number(t.assignedToId) === agencyUserId
        );
  
        this.createdTasks = (tasks.created ?? []).filter(
          t => Number(t.createdByUserId) === agencyUserId
        );
  
        this.tasks = [...this.assignedTasks];
  
        const { assignedEvents, createdEvents } =
          this.splitEventsByRole(events || [], role);
  
        this.assignedEvents = assignedEvents;
        this.createdEvents = createdEvents;
        this.events = [...assignedEvents];
  
        this.refreshCalendarEvents();
      },
      error: err => console.error('❌ Agency calendar error', err)
    });
  }

  private buildTaskRequests(
    role: string | null
  ): Observable<{ assigned: Task[]; created: Task[] }> | null {
  
    if (!role || !role.startsWith('AGENCY')) return null;
  
    const agencyUserId = this.getAgencyUserId();
    const agencyIdToUse = this.agencyId || this.currentAgencyId;
  
    if (role === 'AGENCY_TEAM_MEMBER' || role === 'AGENCY_RELATIONSHIP_MANAGER') {
      if (!agencyUserId) return null;
  
      return forkJoin({
        assigned: this.taskService.getTasksByAgencyUser(agencyUserId),
        created: this.taskService.getTasksCreatedByAgencyUser(agencyUserId),
      });
    }
  
    if (role === 'AGENCY_ADMIN') {
      if (!agencyIdToUse) return null;
  
      return forkJoin({
        assigned: this.taskService.getTasksByAgency(agencyIdToUse),
        created: agencyUserId
          ? this.taskService.getTasksCreatedByAgencyUser(agencyUserId)
          : this.taskService.getTasksByAgency(agencyIdToUse),
      });
    }
  
    return null;
  }

  private buildEventRequest(): Observable<AllEvents[]> | null {
    const role = this.getRole();
    const agencyIdToUse = this.agencyId || this.currentAgencyId;
  
    if (!role?.startsWith('AGENCY')) return null;
  
    if (agencyIdToUse) {
      return this.eventService.getEventsByAgency(agencyIdToUse);
    }
  
    return null;
  }

  private refreshCalendarEvents(): void {

    // ✅ CREATED TASKS ONLY
    const taskEvents = (this.createdTasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      start: t.startTime
        ? new Date(`${t.startDate}T${t.startTime}`)
        : new Date(`${t.startDate}T00:00`),
      end: t.endTime
        ? new Date(`${t.endDate}T${t.endTime}`)
        : new Date(`${t.endDate}T23:59`),
      type: 'task',
    }));
  
  
    // ✅ CREATED EVENTS ONLY
    const eventEvents = (this.createdEvents ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      start: e.startTime
        ? new Date(`${e.startDate}T${e.startTime}`)
        : new Date(`${e.startDate}T00:00`),
      end: e.endTime
        ? new Date(`${e.endDate}T${e.endTime}`)
        : new Date(`${e.endDate}T23:59`),
      type: 'event',
    }));
  
  
    this.calendarEvents = [...taskEvents, ...eventEvents];
  
    if (this.calendar) {
      this.calendar.reloadCalendarEvents(this.calendarEvents);
    }
  }

  saveTask() {
    const agencyUserId = this.getAgencyUserId();
    if (!agencyUserId || agencyUserId <= 0) {
      Swal.fire('Error', 'User session expired. Please login again.', 'error');
      return;
    }
    const taskRequest: any = {
      title: this.newTask.title,
      description: this.newTask.description,
      allDay: this.newTask.allDay,
      startDate: this.newTask.startDate,
      endDate: this.newTask.endDate,
      startTime: this.newTask.startTime || null,
      endTime: this.newTask.endTime || null,
      status: this.newTask.status,
  
      agencyId: this.agencyId || this.currentAgencyId,
      createdByUserId: agencyUserId,
  
      assignedToId: null,
      assignedCustomerUserId: null
    };
  
    // ✅ customer room → assign to customer USER
    if (this.customerRoomMode && this.customerUserId) {
      taskRequest.assignedCustomerUserId = this.customerUserId;
    } else {
      taskRequest.assignedToId = this.newTask.assignedToId;
    }
  
    this.submitTask(taskRequest);
  }

  private submitTask(taskRequest: any) {
    this.taskService.addTask(taskRequest).subscribe({
      next: (savedTask: Task) => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Task created successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        
        const assigneeId = taskRequest.assignedToId;
        if (assigneeId) {
          this.notificationSocket.emit('send_notification', {
            title: 'Task Assigned',
            message: `A new task "${taskRequest.title}" has been assigned to you.`,
            type: 'TASK_ASSIGNED',
            entityType: 'TASK',
            entityId: savedTask.id,
            recipientId: assigneeId,
            recipientType: 'AGENCY_USER'
          });
        }
        
        this.loadAllData();
        this.resetTaskForm();
      },
      error: (err) => {
        console.error('❌ Task error:', err);
        this.showBackendValidationError(err, 'Task Creation Failed');
      },
    });
  }

  resetTaskForm() {
    this.newTask = {
      title: '',
      description: '',
      allDay: false,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      status: 'PENDING',
      assignedToId: null,
      agencyId: this.agencyId || this.currentAgencyUserId || null,
    };
  }

  saveEvent() {
    const role = this.getRole();
    const body: any = {
      title: this.newEvent.title,
      description: this.newEvent.description,
      startDate: this.newEvent.startDate,
      endDate: this.newEvent.endDate,
      startTime: this.newEvent.startTime || null,
      endTime: this.newEvent.endTime || null,
      allDay: this.newEvent.allDay,
      location: this.newEvent.location,
      address: this.newEvent.address,
      googleMeetLink: this.newEvent.googleMeetLink || null,
      status: this.newEvent.status,
      agencyId: this.agencyId || this.currentAgencyId,
  
      createdByUserId: this.getAgencyUserId(),
      assignedUserId: null,
      assignedCustomerUserId: null
    };
  
    // ✅ customer room
    if (this.customerRoomMode && this.customerUserId) {
      body.assignedCustomerUserId = this.customerUserId;
    } else {
      body.assignedUserId = this.newEvent.assignedUserId;
    }
  
    if (role?.startsWith('AGENCY')) {
      this.submitEvent(body);
    } else {
      console.error('❌ Unsupported role:', role);
    }
  }
  

  private submitEvent(body: any) {
    this.eventService.createEvent(body).subscribe({
      next: (savedEvent: AllEvents) => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Event created successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        
        const assigneeId = savedEvent.assigneeId;
        if (assigneeId) {
          this.notificationSocket.emit('send_notification', {
            title: 'Event Assigned',
            message: `A new event "${body.title}" has been assigned to you.`,
            type: 'EVENT_ASSIGNED',
            recipientId: assigneeId,
            recipientType: 'AGENCY_USER',
            entityType: 'EVENT',
            entityId: savedEvent.id,
          });
        }
        
        this.loadAllData();
        this.resetEventForm();

        const modal = bootstrap.Modal.getInstance(
          document.getElementById(this.addModalId)
        );
        modal?.hide();
      },
      error: (err) => {
        console.error('❌ Event error:', err);
        this.showBackendValidationError(err, 'Event Creation Failed');
      },
    });
  }

  private splitEventsByRole(
    events: AllEvents[],
    role: string | null
  ): { assignedEvents: AllEvents[]; createdEvents: AllEvents[] } {
  
    const agencyUserId = Number(this.getAgencyUserId());
  
    let assignedEvents: AllEvents[] = [];
    let createdEvents: AllEvents[] = [];
  
    if (this.customerRoomMode && this.customerUserId) {
  
      // ✅ only customer USER events
      assignedEvents = (events || []).filter(e =>
        Number(e.assignedCustomerUserId) === Number(this.customerUserId)
      );
  
      createdEvents = [...assignedEvents];
  
    } else {
  
      // ✅ agency normal
      assignedEvents = (events || []).filter(e =>
        Number(e.assigneeId) === agencyUserId
      );
  
      createdEvents = (events || []).filter(e =>
        Number(e.createdByUserId) === agencyUserId
      );
    }
  
    return { assignedEvents, createdEvents };
  }
  resetEventForm() {
    this.newEvent = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      allDay: false,
      location: '',
      address: '',
      googleMeetLink: '',
      status: 'SCHEDULED',
      assignedUserId: null,
      assignedCustomerUserId: null,
      assignedBranchUserId: null,
      createdByUserId: null,
      createdByCustomerUserId: null,
      createdByBranchUserId: null
    };
  }

  deleteEvent(eventId: number) {
    if (!this.selectedEvent) return;

    const assigneeId = this.selectedEvent.assigneeId;

    const recipientType = this.selectedEvent.assignedUserId ? 'AGENCY_USER' : 'CUSTOMER_USER';

    Swal.fire({
      title: 'Are you sure?',
      text: 'This event will be deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.eventService.deleteEvent(eventId).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Event deleted successfully!',
            timer: 1500,
            showConfirmButton: false,
          });
          
          if (assigneeId) {
            this.notificationSocket.emit('send_notification', {
              title: 'Event Deleted',
              message: `Event "${this.selectedEvent?.title}" has been deleted.`,
              type: 'EVENT_DELETED',
              recipientId: assigneeId,
              recipientType: recipientType,
            });
          }

          this.loadAllData();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('agencyEventModal')
          );
          modal?.hide();
        },
        error: (err) => {
          console.error('Delete error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete event!',
          });
        },
      });
    });
  }

  deleteTask() {
    if (!this.selectedTask || !this.selectedTask.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Task ID not found!',
      });
      return;
    }

    const assigneeId = this.selectedTask.assignedToId;
    const recipientType = 'AGENCY_USER';

    Swal.fire({
      title: 'Are you sure?',
      text: 'This task will be deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.taskService.deleteTask(this.selectedTask!.id!).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Task deleted successfully!',
            timer: 1500,
            showConfirmButton: false,
          });

          if (assigneeId) {
            this.notificationSocket.emit('send_notification', {
              title: 'Task Deleted',
              message: `Task "${this.selectedTask?.title}" has been deleted.`,
              type: 'TASK_DELETED',
              recipientId: assigneeId,
              recipientType: recipientType,
            });
          }
          
          const modal = bootstrap.Modal.getInstance(
            document.getElementById('agencyTaskModal')
          );
          modal.hide();

          this.loadAllData();
        },
        error: (err) => {
          console.error('Delete error:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete task!',
          });
        },
      });
    });
  }

  markTaskCompleted(task: Task) {
    if (!task.id) {
      alert('Task ID missing!');
      return;
    }
    const updatedTask = {
      ...task,
      status: 'COMPLETED',
    };
    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Completed',
          text: 'Task marked as completed!',
          timer: 1500,
          showConfirmButton: false,
        });
        
        const creatorId = task.createdByUserId;

        if (creatorId) {
          this.notificationSocket.emit('send_notification', {
            title: 'Task Completed',
            message: `Your task "${task.title}" has been marked as completed.`,
            type: 'TASK_COMPLETED',
            recipientId: creatorId,
            recipientType: 'AGENCY_USER',
          });
        }
        
        this.loadAllData();
      },
      error: (err) => {
        console.error('Status update error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to update task status!',
        });
      },
    });
  }

  setActiveTab(tab: number) {
    this.activeTab = tab;
    if (tab === 2 && !this.activeInnerTab) {
      this.activeInnerTab = 'task';
    }
  }

  setModalTab(tab: 'task' | 'event') {
    this.modalActiveTab = tab;
  }

  openAddMeeting() {
    const modalEl = document.getElementById(this.addModalId);
    if (!modalEl) return;
    this.modalActiveTab = 'event';
    this.activeInnerTab = 'event';
    setTimeout(() => {
      const eventTab = document.getElementById('pills-AddEvent-tab');
      eventTab?.classList.add('active');
      const eventPane = document.getElementById('pills-AddEvent');
      eventPane?.classList.add('show', 'active');
    }, 0);

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }

  setInnerTab(tab: 'task' | 'event') {
    this.activeInnerTab = tab;
  }

  formatDateWithDay(dateString: string): string {
    if (!dateString) return '';
    const dt = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const dayName = dt.toLocaleDateString('en-US', options);
    const formattedDate = dt
      .toISOString()
      .split('T')[0]
      .split('-')
      .reverse()
      .join('-');

    return `${formattedDate} (${dayName})`;
  }

  updateEventStatus(
    eventId: number,
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  ) {
    this.eventService.getEventById(eventId).subscribe({
      next: (fullEvent) => {
        this.selectedEvent = fullEvent;

        this.eventService.changeEventStatus(eventId, status).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Updated',
              text: `Event marked as ${status}!`,
              timer: 1500,
              showConfirmButton: false,
            });

            const creatorId = fullEvent.createdByUserId;
            if (creatorId) {
              this.notificationSocket.emit('send_notification', {
                title: 'Event Completed',
                message: `Your event "${fullEvent.title}" has been marked as ${status}.`,
                type: 'EVENT_COMPLETED',
                recipientId: creatorId,
                recipientType: 'AGENCY_USER',
                entityType: 'EVENT',
                entityId: fullEvent.id
              });
            }

            const assigneeId = fullEvent.assignedUserId;
            if (assigneeId && assigneeId !== creatorId) {
              this.notificationSocket.emit('send_notification', {
                title: 'Event Completed',
                message: `Event "${fullEvent.title}" has been marked as ${status}.`,
                type: 'EVENT_COMPLETED',
                recipientId: assigneeId,
                recipientType: 'AGENCY_USER',
                entityType: 'EVENT',
                entityId: fullEvent.id
              });
            }

            this.loadAllData();
          },
          error: (err) => {
            console.error('❌ Status update error:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Failed to update event status!',
            });
          },
        });
      },
      error: (err) => {
        console.error('❌ Failed to fetch event:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to load event details!',
        });
      }
    });
  }

  onCalendarEventClick(eventId: number) {
    this.eventService.getEventById(eventId).subscribe((event) => {
      this.selectedEvent = event;
      const modal = new bootstrap.Modal(document.getElementById('agencyEventModal'));
      modal.show();
    });
  }

  openEventEditModel() {
    if (!this.selectedEvent) return;
    this.editEventModel = { ...this.selectedEvent };
    const modal = new bootstrap.Modal(document.getElementById('agencyEventEditModal'));
    modal.show();
  }

  updateEvent() {
    const assigneeId = this.editEventModel.assignedUserId;
    const recipientType = 'AGENCY_USER';
    
    this.eventService
      .updateEvent(this.editEventModel.id, this.editEventModel)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'Event updated successfully!',
            timer: 1500,
            showConfirmButton: false,
          });
          
          if (assigneeId) {
            this.notificationSocket.emit('send_notification', {
              title: 'Event Updated',
              message: `Event "${this.editEventModel.title}" has been updated.`,
              type: 'EVENT_UPDATED',
              recipientId: assigneeId,
              recipientType: recipientType,
            });
          }
          
          this.loadAllData();
          const modal = bootstrap.Modal.getInstance(
            document.getElementById('agencyEventEditModal')
          );
          modal?.hide();
        },
        error: (err) => {
          console.error('❌ Edit Event error:', err);
          this.showBackendValidationError(err, 'Event Update Failed');
        },
      });
  }

  onCalendarViewChange(event: any) {
    const view = event.target.value;
    this.calendar.changeView(view);
    this.calendar.onViewChange(view);
  }

  onTaskClicked(taskId: number) {
    this.taskService.getTaskById(taskId).subscribe((task) => {
      this.selectedTask = task;
      const modal = new bootstrap.Modal(document.getElementById('agencyTaskModal'));
      modal.show();
    });
  }

  openEditModal() {
    if (!this.selectedTask) return;
    this.editTaskModel = { ...this.selectedTask };
    const modal = new bootstrap.Modal(document.getElementById('agencyTaskEditModal'));
    modal.show();
  }

  saveEditedTask() {
    const assigneeId = this.editTaskModel.assignedToId;
    const recipientType = 'AGENCY_USER';
    
    this.taskService
      .updateTask(this.editTaskModel.id, this.editTaskModel)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'Task updated successfully!',
            timer: 1500,
            showConfirmButton: false,
          });
          
          if (assigneeId) {
            this.notificationSocket.emit('send_notification', {
              title: 'Task Updated',
              message: `Task "${this.editTaskModel.title}" has been updated.`,
              type: 'TASK_UPDATED',
              recipientId: assigneeId,
              recipientType: recipientType,
              entityType: 'TASK',
              entityId: this.editTaskModel.id
            });
          }
          
          this.loadAllData();
          const modal = bootstrap.Modal.getInstance(
            document.getElementById('agencyTaskEditModal')
          );
          modal?.hide();
        },
        error: (err) => {
          console.error('❌ Edit Task error:', err);
          this.showBackendValidationError(err, 'Task Update Failed');
        },
      });
  }

  handleCalendarClick(data: { id: number; type: string }) {
    if (data.type === 'task') {
      this.onTaskClicked(data.id);
    } else {
      this.onCalendarEventClick(data.id);
    }
  }

  openMonthYearPicker() {
    const modal = new bootstrap.Modal(
      document.getElementById('agencyMonthYearPicker')
    );
    modal.show();
  }

  applyMonthYear() {
    this.currentMonth =
      this.months[this.selectedMonth] + ' ' + this.selectedYear;
    let date = new Date(this.selectedYear, this.selectedMonth, 1);
    const api = this.calendar.fullCalendar.getApi();
    const currentView = api.view.type;
    if (currentView === 'timeGridWeek') {
      let day = date.getDay();
      let diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
    }
    this.calendar.gotoDate(date);
    setTimeout(() => {
      this.loadAllData();
    }, 30);
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('agencyMonthYearPicker')
    );
    modal?.hide();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['openAddEventForm'] && this.openAddEventForm === true) {
      this.modalActiveTab = 'event';
      this.hideAddButton = true;
      this.activeInnerTab = '' as '';
      this.openAddEventModal();
    }
  }

  openAddEventModal() {
    const modalElement = document.getElementById(this.addModalId);
    if (modalElement) {
      this.modalActiveTab = 'event';
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  goPrevious() {
    const api = this.calendar.fullCalendar.getApi();
    api.prev();
    this.updateDayLabel(api);
  }

  goNext() {
    const api = this.calendar.fullCalendar.getApi();
    api.next();
    this.updateDayLabel(api);
  }

  goToday() {
    const api = this.calendar.fullCalendar.getApi();
    api.today();
    this.setTodayLabel();
  }

  setTodayLabel() {
    const today = new Date();
    this.currentDayLabel = 'Today';
    this.currentMonth = today.toLocaleString('en-US', { month: 'long' });
    this.currentYear = today.getFullYear();
    this.loadAllData();
  }

  updateDayLabel(api: any) {
    const date = api.getDate();
    this.currentDayLabel = date.toLocaleString('en-US', {
      weekday: 'long',
    });
    this.currentMonth = date.toLocaleString('en-US', { month: 'long' });
    this.currentYear = date.getFullYear();
    this.loadAllData();
  }

  private showBackendValidationError(err: any, title: string) {
    let message = 'Something went wrong!';

    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      message = err.error.errors
        .map((e: any) => `${e.defaultMessage}`)
        .join('\n');
    } else if (err?.error?.details && typeof err.error.details === 'object') {
      message = Object.values(err.error.details)
        .map((msg: any) => `${msg}`)
        .join('\n');
    } else if (err?.error?.message) {
      message = err.error.message;
    }
    
    Swal.fire({
      icon: 'error',
      title: title,
      html: message.replace(/\n/g, '<br>'),
      confirmButtonText: 'OK'
    });
  }

  private listenForTaskOrEventFromNotification(): void {
    this.route.queryParams.subscribe(params => {
      console.log('🔔 Notification params:', params);

      if (params['openTab']) {
        this.activeTab = 2;
      }

      if (params['openTab'] === 'task') {
        this.activeInnerTab = 'task';
      }

      if (params['openTab'] === 'event') {
        this.activeInnerTab = 'event';
      }
    });
  }
  private normalizeRole(role: any): string | null {
    if (!role) return null;
  
    if (Array.isArray(role)) {
      return role[0]; 
    }
  
    return role;
  }
  
}

