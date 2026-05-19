import { Component, Input, OnInit, AfterViewInit, ViewChild, SimpleChanges, OnChanges, } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../../../models/Task.model';
import { AllEvents } from '../../../models/AllEvents.model';
import { EventService } from '../../../services/event.service';
import { TaskService } from '../../../services/task.service';
import { CalenderComponent } from '../calender/calender.component';
import { CustomerUserService } from '../../../services/customer-user.service';
import { CustomerUser } from '../../../models/CustomerUser.model';
import { AuthService } from '../../../../auth/services/auth.service';
import Swal from 'sweetalert2';
import { BranchUser } from '../../../models/BranchUser.model';
import { BranchUserService } from '../../../services/branch-user.service';
import { UserService } from '../../../../agency-portal/services/user-service/user.service';
import { UserResponse } from '../../../../agency-portal/interfaces/user-request';
import { SocketService } from '../../../../socket-services/socket.service';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';
declare var bootstrap: any;
@Component({
  selector: 'app-task-calender',
  standalone: true,
  imports: [CommonModule, FormsModule, CalenderComponent],
  templateUrl: './task-calender.component.html',
  styleUrls: ['./task-calender.component.css'],
})
export class TaskCalenderComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(CalenderComponent) calendar!: CalenderComponent;
  addModalId = 'taskCalendarAddModal';
  @Input() agencyId?: number;
  @Input() hideAddButton = false;
  @Input() isAgencyView = false;

  @Input() openAddEventForm: boolean = false;
  openAddMeetingMode = false;
  @Input() defaultModalTab: 'task' | 'event' = 'task';

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
  customers: CustomerUser[] = [];

  private currentUserRole: string | null = null;
  private currentAgencyUserId: number | null = null;
  private currentCustomerUserId: number | null = null;

  currentMonth: string = '';
  currentYear: number = 0;

  selectedEvent: any = null;
  editEventModel: any = {};

  selectedTask: Task | null = null;
  editTaskModel: any = {};

  calendarEvents: any[] = [];

  agencyUsers: any[] = [];
  branchUsers: BranchUser[] = [];
  branchId!: number;

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
    startTime: null,
    endTime: null,
    status: 'PENDING',
    assignedCustomerUserId: null,
    assignedToId: null,
    assignedBranchUserId: null,
    leadId: null,
    agencyId: null,
  };

  newEvent: AllEvents = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: null,
    endTime: null,
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
    private customerUserService: CustomerUserService,
    private authService: AuthService,
    private branchUserService: BranchUserService,
    private userService: UserService,
    private notificationSocket: NotificationSocketService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const today = new Date();
    this.currentMonth = today.toLocaleString('en-US', { month: 'long' });
    this.currentYear = today.getFullYear();
    for (let y = 2000; y <= 2030; y++) {
      this.years.push(y);
    }
    if (this.agencyId) {
      this.newEvent.assignedUserId = this.agencyId;
      this.newTask.agencyId = this.agencyId;
    }

    this.fetchCurrentUserContext(() => {
      const role = this.getRole();
      if (role === 'CUSTOMER_TEAM_MEMBER' || role === 'CUSTOMER_ADMIN') {
        this.notificationSocket.connect('CUSTOMER_USER', this.currentCustomerUserId!);
      }

      if (role?.startsWith('AGENCY')) {
        this.notificationSocket.connect('AGENCY_USER', this.currentAgencyUserId!);
      }

      const branchUserId = Number(localStorage.getItem('branchUserId'));
      if (role?.startsWith('BRANCH') && branchUserId > 0) {
        this.notificationSocket.connect('BRANCH_USER', branchUserId);
      } else {
        console.warn('Branch user ID not available yet, delaying socket connection...');
      }

      this.notificationSocket.notification$.subscribe(n => {
        console.log(' UI Notification:', n);

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
          n.type === 'TASK_UPDATED' ||
          n.type === 'TASK_DELETED' ||
          n.type === 'TASK_COMPLETED' ||
          n.type === 'EVENT_ASSIGNED' ||
          n.type === 'EVENT_UPDATED' ||
          n.type === 'EVENT_DELETED' ||
          n.type === 'EVENT_COMPLETED'
        ) {
          this.loadAllData();
        }

      });

      if (role === 'BRANCH_ADMIN') {
        this.loadBranchTeamMembers();
      } else if (!this.isAgencyView) {
        this.loadCustomerUsers();
      }

      if (this.isAgencyView && this.agencyId) {
        this.loadAgencyUsers();
      }

      this.loadAllData();
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
    return this.currentUserRole ?? localStorage.getItem('role');
  }

  private getAgencyUserId(): number | null {
    return this.getRole()?.startsWith('AGENCY') ? Number(localStorage.getItem('userId')) : null;
  }

  private getCustomerUserId(): number | null {
    return this.getRole()?.startsWith('CUSTOMER') ? Number(localStorage.getItem('customerUserId')) : null;
  }

  loadCustomerUsers() {
    if (this.isAgencyView) return;
    const loggedInCustomerId = this.currentCustomerUserId;
    this.customerUserService.getAllUsers().subscribe({
      next: (users) => {
        this.customers = users.filter(
          (u) => u.role === 'CUSTOMER_TEAM_MEMBER'
            &&
            u.id !== loggedInCustomerId
        );
      },
      error: (err) => console.error(err),
    });
  }
  loadBranchTeamMembers() {
    if (!this.branchId) {
      console.error(' branchId missing');
      return;
    }
    const loggedInBranchUserId = Number(localStorage.getItem('branchUserId'));
    this.branchUserService.getUsersByBranch(this.branchId, 0, 100).subscribe({
      next: (res) => {
        this.branchUsers = res.content.filter(
          (u: BranchUser) =>
            u.role === 'BRANCH_TEAM_MEMBER' && u.status === 'ACTIVE'
            &&
            u.id !== loggedInBranchUserId
        );
      },
      error: (err) => console.error(err),
    });
  }

  loadAgencyUsers() {
    if (!this.agencyId) {
      console.error(' agencyId missing');
      return;
    }
    this.userService.getUsersByAgency(this.agencyId).subscribe({
      next: (users) => {
        this.agencyUsers = users.filter(
          (u: UserResponse) =>
            u.role === 'AGENCY_RELATIONSHIP_MANAGER' && u.status === 'ACTIVE'
        );
      },
      error: (err) => console.error('Error loading agency users:', err),
    });
  }

  private fetchCurrentUserContext(done: () => void) {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        const role = user?.role || user?.roles?.[0] || null;
        this.currentUserRole = role;

        localStorage.removeItem('userId');
        localStorage.removeItem('customerUserId');

        if (role === 'CUSTOMER_TEAM_MEMBER') {
          this.currentCustomerUserId = Number(user.id);
          localStorage.setItem('customerUserId', String(user.id));
        }

        if (role === 'CUSTOMER_ADMIN') {
          const customerUserId =
            user.customerUserId || user.customer?.id || user.id;

          if (!customerUserId) {
            console.error(' CUSTOMER_ADMIN customerUserId missing', user);
          } else {
            this.currentCustomerUserId = Number(customerUserId);
            localStorage.setItem('customerUserId', String(customerUserId));
          }
        }

        if (role?.startsWith('AGENCY')) {
          this.currentAgencyUserId = Number(user.id);
          localStorage.setItem('userId', String(user.id));
        }

        if (role?.startsWith('BRANCH')) {

          const branchId =
            user.branchId ||
            user.branch?.id ||
            user.branchID ||
            Number(localStorage.getItem('branchId'));

          if (branchId) {
            this.branchId = Number(branchId);

            localStorage.setItem('branchId', String(this.branchId));
            localStorage.setItem('branchUserId', String(user.id));
            console.log('Branch user login context:', {
              branchUserId: user.id,
              branchId: this.branchId
            });

            this.loadBranchTeamMembers();
          } else {
            console.error(' branchId missing in logged in user:', user);
            console.error(' Available keys:', Object.keys(user));
          }
        }
        localStorage.setItem('role', role ?? '');
        done();
      },
      error: () => done(),
    });
  }

  loadAllUsers() {
    this.customerUserService.getAllUsers().subscribe({
      next: (users) => {
        this.customers = users.filter(
          (u) => u.role === 'CUSTOMER_TEAM_MEMBER' && u.status === 'ACTIVE'
        );
        console.log('Filtered Users:', this.customers);
        if (this.customers.length > 0) {
          this.newTask.assignedToId = this.customers[0].id;
        }
      },
      error: (err) => console.error('Error loading users:', err),
    });
  }

  public loadAllData(): void {
    const role = this.getRole();
    const taskRequests$ = this.buildTaskRequests(role);
    const eventRequest$ = this.buildEventRequest();

    if (!role || !taskRequests$ || !eventRequest$) {
      console.warn(' Missing role or requests to load data');
      return;
    }

    forkJoin({ tasks: taskRequests$, events: eventRequest$ }).subscribe({
      next: ({ tasks, events }) => {
        if (this.isAgencyView && this.agencyId) {
          const agencyIdNum = Number(this.agencyId);

          this.assignedTasks = (tasks.assigned ?? []).filter(
            task => Number(task.agencyId) === agencyIdNum
          );

          this.createdTasks = (tasks.created ?? []).filter(
            task => Number(task.agencyId) === agencyIdNum
          );
        } else {
          this.assignedTasks = (tasks.assigned ?? []).filter(
            task => task.agencyId == null
          );

          this.createdTasks = (tasks.created ?? []).filter(
            task => task.agencyId == null
          );
        }
        this.tasks = this.assignedTasks;

        if (this.isAgencyView && this.agencyId) {
          const agencyIdNum = Number(this.agencyId);
          if (events && events.length > 0) {
            console.log('🔍 Sample events (first 5):', events.slice(0, 5).map(e => ({
              id: e.id,
              title: e.title,
              agencyId: e.agencyId,
              agencyIdType: typeof e.agencyId
            })));
          }
          const agencyEvents = (events || []).filter((event) => {
            if (event.agencyId == null || event.agencyId === undefined) {
              return false;
            }
            const eventAgencyId = Number(event.agencyId);
            const matches = eventAgencyId === agencyIdNum && !isNaN(eventAgencyId);

            if (matches) {
              console.log(' Event matched:', {
                id: event.id,
                title: event.title,
                eventAgencyId: event.agencyId,
                converted: eventAgencyId,
                target: agencyIdNum
              });
            }

            return matches;
          });
          this.assignedEvents = agencyEvents;
          this.events = agencyEvents;
          this.createdEvents = agencyEvents;
        } else {
          const { assignedEvents, createdEvents } = this.splitEventsByRole(
            events,
            role
          );
          this.assignedEvents = assignedEvents ?? [];
          this.events = this.assignedEvents;
          this.createdEvents = createdEvents ?? [];
        }

        this.refreshCalendarEvents();
      },
      error: (err) => console.error(' Data load error', err),
    });
  }

  private buildTaskRequests(
    role: string | null
  ): Observable<{ assigned: Task[]; created: Task[] }> | null {
    if (!role) return null;

    if (this.isAgencyView && this.agencyId) {
      if (role === 'AGENCY_TEAM_MEMBER') {
        const agencyUserId = this.getAgencyUserId();
        if (!agencyUserId) return null;
        return forkJoin({
          assigned: this.taskService.getTasksByAgencyUser(agencyUserId),
          created: this.taskService.getTasksCreatedByAgencyUser(agencyUserId),
        });
      }

      if (role === 'AGENCY_ADMIN') {
        const agencyUserId = this.getAgencyUserId();
        return forkJoin({
          assigned: this.taskService.getTasksByAgency(this.agencyId),
          created: agencyUserId
            ? this.taskService.getTasksCreatedByAgencyUser(agencyUserId)
            : this.taskService.getTasksByAgency(this.agencyId),
        });
      }
      return forkJoin({
        assigned: this.taskService.getTasksByAgency(this.agencyId),
        created: this.taskService.getTasksByAgency(this.agencyId),
      });
    }
    if (
      !this.isAgencyView &&
      (role === 'CUSTOMER_ADMIN' || role === 'CUSTOMER_TEAM_MEMBER')
    ) {
      const customerUserId = this.getCustomerUserId();
      if (!customerUserId) {
        console.warn(' customerUserId missing');
        return null;
      }

      return forkJoin({
        assigned: this.taskService.getTasksByCustomerUser(customerUserId),
        created: this.taskService.getTasksCreatedByCustomer(customerUserId),
      });
    }
    if (role === 'BRANCH_ADMIN' || role === 'BRANCH_TEAM_MEMBER') {
      const branchUserId = Number(localStorage.getItem('branchUserId'));
      if (!branchUserId) {
        console.warn(' branchUserId missing');
        return null;
      }

      return forkJoin({
        assigned: this.taskService.getTasksByAssignedBranchUser(branchUserId),
        created: this.taskService.getTasksCreatedByBranchUser(branchUserId),
      });
    }

    return null;
  }

  private buildEventRequest(): Observable<AllEvents[]> | null {
    const role = this.getRole();
    if (role === 'BRANCH_ADMIN' || role === 'BRANCH_TEAM_MEMBER') {
      const branchUserId = Number(localStorage.getItem('branchUserId'));
      if (!branchUserId) {
        console.warn(' branchUserId missing');
        return null;
      }
      return forkJoin({
        assigned: this.eventService.getEventsAssignedToBranchUser(branchUserId),
        created: this.eventService.getEventsCreatedByBranchUser(branchUserId),
      }).pipe(
        map(({ assigned, created }) => [...assigned, ...created])
      );
    }
    if (this.isAgencyView && this.agencyId) {
      return this.eventService.getEventsByAgency(this.agencyId);
    }
    return this.eventService.getAllEvents();
  }

  private refreshCalendarEvents(): void {
    const tasksToShow = this.isAgencyView
      ? [...(this.assignedTasks ?? []), ...(this.createdTasks ?? [])]
      : (this.createdTasks ?? []);
    const uniqueTasks = tasksToShow.filter((task, index, self) =>
      index === self.findIndex((t) => t.id === task.id)
    );
    const taskEvents =
      uniqueTasks?.map((t) => ({
        id: t.id,
        title: t.title,
        start: t.startTime
          ? new Date(`${t.startDate}T${t.startTime}`)
          : new Date(`${t.startDate}T00:00`),
        end: t.endTime
          ? new Date(`${t.endDate}T${t.endTime}`)
          : new Date(`${t.endDate}T23:59`),
        type: 'task',
      })) ?? [];
    const eventsToShow = this.isAgencyView
      ? (this.createdEvents ?? [])
      : (this.createdEvents ?? []);
    const uniqueEvents = eventsToShow.filter((event, index, self) =>
      index === self.findIndex((e) => e.id === event.id)
    );
    const eventEvents =
      uniqueEvents?.map((e) => {
        const eventObj = {
          id: e.id,
          title: e.title,
          start: e.startTime
            ? new Date(`${e.startDate}T${e.startTime}`)
            : new Date(`${e.startDate}T00:00`),
          end: e.endTime
            ? new Date(`${e.endDate}T${e.endTime}`)
            : new Date(`${e.endDate}T23:59`),
          type: 'event',
        };
        return eventObj;
      }) ?? [];

    this.calendarEvents = [...taskEvents, ...eventEvents];

    if (this.calendar) {
      this.calendar.reloadCalendarEvents(this.calendarEvents);
    } else {
      console.warn(' Calendar component not found!');
    }
  }

  saveTask() {
    const role = this.getRole();

    const taskRequest: any = {
      title: this.newTask.title,
      description: this.newTask.description,
      allDay: this.newTask.allDay,
      startDate: this.newTask.startDate,
      endDate: this.newTask.endDate,
      startTime: this.newTask.startTime || null,
      endTime: this.newTask.endTime || null,
      status: this.newTask.status,
      leadId: this.newTask.leadId,
      agencyId: this.agencyId ?? this.newTask.agencyId ?? null,
    };

    if (role === 'BRANCH_ADMIN' || role === 'BRANCH_TEAM_MEMBER') {
      taskRequest.createdByBranchUserId = Number(
        localStorage.getItem('branchUserId')
      );

      taskRequest.createdByUserId = null;
      taskRequest.createdByCustomerUserId = null;
      taskRequest.assignedBranchUserId =
        this.newTask.assignedBranchUserId &&
          this.newTask.assignedBranchUserId > 0
          ? this.newTask.assignedBranchUserId
          : null;

      taskRequest.assignedToId = null;
      taskRequest.assignedCustomerUserId = null;

      console.log(' FINAL BRANCH TASK PAYLOAD', taskRequest);
      return this.submitTask(taskRequest);
    }
    if (role === 'CUSTOMER_TEAM_MEMBER' || role === 'CUSTOMER_ADMIN') {
      taskRequest.createdByCustomerUserId = Number(
        localStorage.getItem('customerUserId')
      );
      taskRequest.createdByUserId = null;
      taskRequest.assignedCustomerUserId =
        this.newTask.assignedCustomerUserId &&
          this.newTask.assignedCustomerUserId > 0
          ? this.newTask.assignedCustomerUserId
          : null;

      taskRequest.assignedToId = null;

      console.log(' FINAL CUSTOMER TASK PAYLOAD', taskRequest);
      return this.submitTask(taskRequest);
    }
    if (role?.startsWith('AGENCY')) {
      taskRequest.createdByUserId = Number(localStorage.getItem('userId'));
      taskRequest.createdByCustomerUserId = null;
      taskRequest.assignedToId =
        this.newTask.assignedToId && this.newTask.assignedToId > 0
          ? this.newTask.assignedToId
          : null;
      taskRequest.assignedCustomerUserId = null;
      console.log(' FINAL AGENCY TASK PAYLOAD', taskRequest);
      return this.submitTask(taskRequest);
    }

    console.error(' Unsupported role:', role);
  }
  private submitTask(taskRequest: any) {
    Swal.fire({
    title: 'Saving...',
    text: 'Please wait',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

    this.taskService.addTask(taskRequest).subscribe({
      next: (savedTask: Task) => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Task created successfully!',
          timer: 1200,
          showConfirmButton: false,
        });
        const assigneeId = taskRequest.assignedToId ?? taskRequest.assignedCustomerUserId ?? taskRequest.assignedBranchUserId;
         setTimeout(() => {
        this.loadAllData();
      }, 100);

        this.resetTaskForm();
      },
      error: (err) => {
        Swal.close();
        console.error(' Task error:', err);
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
      startTime: null,
      endTime: null,
      status: 'PENDING',
      assignedCustomerUserId: null,
      assignedToId: null,
      assignedBranchUserId: null,
      leadId: null,
      agencyId: this.agencyId ?? null,
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
      agencyId: this.agencyId ?? null,
    };
    if (role === 'BRANCH_ADMIN' || role === 'BRANCH_TEAM_MEMBER') {
      body.createdByBranchUserId = Number(
        localStorage.getItem('branchUserId')
      );

      body.createdByUserId = null;
      body.createdByCustomerUserId = null;

      body.assignedBranchUserId =
        this.newEvent.assignedBranchUserId &&
          this.newEvent.assignedBranchUserId > 0
          ? this.newEvent.assignedBranchUserId
          : null;

      body.assignedUserId = null;
      body.assignedCustomerUserId = null;

      console.log(' FINAL BRANCH EVENT PAYLOAD', body);
      return this.submitEvent(body);
    }
    if (role === 'CUSTOMER_ADMIN' || role === 'CUSTOMER_TEAM_MEMBER') {
      body.createdByCustomerUserId = this.getCustomerUserId();
      body.createdByUserId = null;
      body.assignedCustomerUserId =
        this.newEvent.assignedCustomerUserId || null;
      body.assignedUserId = null;

      console.log(' FINAL CUSTOMER EVENT PAYLOAD', body);
      return this.submitEvent(body);
    }
    if (role?.startsWith('AGENCY')) {
      body.createdByUserId = this.getAgencyUserId();
      body.createdByCustomerUserId = null;

      body.assignedUserId = this.newEvent.assignedUserId || null;
      body.assignedCustomerUserId = null;

      console.log(' FINAL AGENCY EVENT PAYLOAD', body);
      return this.submitEvent(body);
    }

    console.error(' Unsupported role:', role);
  }
  private submitEvent(body: any) {
    Swal.fire({
    title: 'Saving...',
    text: 'Please wait',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
    this.eventService.createEvent(body).subscribe({
      next: (savedEvent: AllEvents) => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Event created successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        const assigneeId =
          body.assignedUserId ??
          body.assignedCustomerUserId ??
          body.assignedBranchUserId;

        setTimeout(() => {
        this.loadAllData();
      }, 100);
        this.resetEventForm();

        const modal = bootstrap.Modal.getInstance(
          document.getElementById(this.addModalId)
        );
        modal?.hide();
      },
      error: (err) => {
        Swal.close();
        console.error(' Event error:', err);
        this.showBackendValidationError(err, 'Event Creation Failed');
      },
    });
  }

  private splitEventsByRole(
    events: AllEvents[],
    role: string | null
  ): { assignedEvents: AllEvents[]; createdEvents: AllEvents[] } {
    const customerUserId = this.getCustomerUserId();
    const agencyUserId = this.getAgencyUserId();
    const branchUserId = Number(localStorage.getItem('branchUserId'));

    const assignedEvents = (events || []).filter((event) => {
      if (role === 'CUSTOMER_ADMIN' || role === 'CUSTOMER_TEAM_MEMBER') {
        return event.assignedCustomerUserId === customerUserId;
      }
      if (role?.startsWith('AGENCY')) {
        return event.assignedUserId === agencyUserId;
      }
      if (role?.startsWith('BRANCH')) {
        return event.assignedBranchUserId === branchUserId;
      }
      return false;
    });

    const createdEvents = (events || []).filter((event) => {
      if (role === 'CUSTOMER_ADMIN' || role === 'CUSTOMER_TEAM_MEMBER') {
        return event.createdByCustomerUserId === customerUserId;
      }
      if (role?.startsWith('AGENCY')) {
        return event.createdByUserId === agencyUserId;
      }
      if (role?.startsWith('BRANCH')) {
        return event.createdByBranchUserId === branchUserId;
      }
      return false;
    });
    return { assignedEvents, createdEvents };
  }

  resetEventForm() {
    this.newEvent = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: null,
      endTime: null,
      allDay: false,
      location: '',
      address: '',
      googleMeetLink: '',
      status: 'SCHEDULED',
      assignedUserId: null,
      assignedCustomerUserId: null,
    };
  }
  refreshCalendarLayout(): void {
    if (!this.calendar || !this.calendar.fullCalendar) return;
    const api = this.calendar.fullCalendar.getApi();
    if (!api) return;

    api.updateSize();
    api.render();
  }

  deleteEvent(eventId: number) {
    if (!this.selectedEvent) return;

    const assigneeId =
      this.selectedEvent.assignedUserId ??
      this.selectedEvent.assignedCustomerUserId ??
      this.selectedEvent.assignedBranchUserId;

    const recipientType =
      this.selectedEvent.assignedCustomerUserId
        ? 'CUSTOMER_USER'
        : this.selectedEvent.assignedUserId
          ? 'AGENCY_USER'
          : 'BRANCH_USER';

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

          this.loadAllData();

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('event')
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

    const assigneeId =
      this.selectedTask.assignedToId ??
      this.selectedTask.assignedCustomerUserId ??
      this.selectedTask.assignedBranchUserId;

    const recipientType =
      this.selectedTask.assignedCustomerUserId
        ? 'CUSTOMER_USER'
        : this.selectedTask.assignedToId
          ? 'AGENCY_USER'
          : 'BRANCH_USER';

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

          const modal = bootstrap.Modal.getInstance(
            document.getElementById('task')
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
        const creatorId =
          task.createdByUserId ??
          task.createdByCustomerUserId ??
          task.createdByBranchUserId;

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
    if (this.isAgencyView) {
      this.modalActiveTab = 'event';
      this.activeInnerTab = 'event';
      setTimeout(() => {
        const eventTab = document.getElementById('pills-AddEvent-tab');
        eventTab?.classList.add('active');
        const eventPane = document.getElementById('pills-AddEvent');
        eventPane?.classList.add('show', 'active');
      }, 0);
    } else {
      this.activeTab = 2;
      this.modalActiveTab = 'event';
      this.activeInnerTab = 'event';
    }

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

            const creatorId =
              fullEvent.createdByUserId ??
              fullEvent.createdByCustomerUserId ??
              fullEvent.createdByBranchUserId;

            const creatorType =
              fullEvent.createdByCustomerUserId
                ? 'CUSTOMER_USER'
                : fullEvent.createdByUserId
                  ? 'AGENCY_USER'
                  : 'BRANCH_USER';


            const assigneeId =
              fullEvent.assignedUserId ??
              fullEvent.assignedCustomerUserId ??
              fullEvent.assignedBranchUserId;

            const assigneeType =
              fullEvent.assignedCustomerUserId
                ? 'CUSTOMER_USER'
                : fullEvent.assignedUserId
                  ? 'AGENCY_USER'
                  : 'BRANCH_USER';

            if (assigneeId && assigneeId !== creatorId) {
              this.notificationSocket.emit('send_notification', {
                title: 'Event Completed',
                message: `Event "${fullEvent.title}" has been marked as ${status}.`,
                type: 'EVENT_COMPLETED',
                recipientId: assigneeId,
                recipientType: assigneeType,
                entityType: 'EVENT',
                entityId: fullEvent.id
              });
            }

            this.loadAllData();
          },

          error: (err) => {
            console.error(' Status update error:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Failed to update event status!',
            });
          },
        });
      },

      error: (err) => {
        console.error(' Failed to fetch event:', err);
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
      const modal = new bootstrap.Modal(document.getElementById('event'));
      modal.show();
    });
  }

  openEventEditModel() {
  if (!this.selectedEvent) return;

  if (this.selectedEvent.status === 'COMPLETED') {
    Swal.fire({
      icon: 'info',
      title: 'Not Allowed',
      text: 'Completed event cannot be edited',
      confirmButtonText: 'OK',
      allowOutsideClick: false
    }).then(() => {
      const modalEl = document.getElementById('event');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    });

    return;
  }

  this.editEventModel = { ...this.selectedEvent };
  const modal = new bootstrap.Modal(document.getElementById('eventedit'));
  modal.show();
}


  updateEvent() {
    const assigneeId =
      this.editEventModel.assignedUserId ??
      this.editEventModel.assignedCustomerUserId ??
      this.editEventModel.assignedBranchUserId;

    const recipientType =
      this.editEventModel.assignedCustomerUserId
        ? 'CUSTOMER_USER'
        : this.editEventModel.assignedUserId
          ? 'AGENCY_USER'
          : 'BRANCH_USER';
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
            document.getElementById('eventedit')
          );
          modal.hide();
        },
        error: (err) => {
          console.error(' Edit Event error:', err);
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
      const modal = new bootstrap.Modal(document.getElementById('task'));
      modal.show();
    });
  }

  openEditModal() {
  if (!this.selectedTask) return;

  if (this.selectedTask.status === 'COMPLETED') {
    Swal.fire({
      icon: 'info',
      title: 'Not Allowed',
      text: 'Completed task cannot be edited',
      confirmButtonText: 'OK',
      allowOutsideClick: false
    }).then(() => {
      const modalEl = document.getElementById('task');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    });

    return;
  }
  this.editTaskModel = { ...this.selectedTask };
  const modal = new bootstrap.Modal(document.getElementById('taskedit'));
  modal.show();
}


  saveEditedTask() {
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

        setTimeout(() => {
          const modalEl = document.getElementById('taskedit');
          const modal = bootstrap.Modal.getInstance(modalEl);
          modal?.hide();

          this.loadAllData();
        }, 300);  
      },

      error: (err) => {
        console.error(' Edit Task error:', err);
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
      document.getElementById('monthYearPicker')
    );
    modal.show();
  }
  isMonthDisabled(i: number): boolean {
    const today = new Date();
    if (this.selectedYear === today.getFullYear()) {
      return i > today.getMonth();
    }
    return false;
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
      document.getElementById('monthYearPicker')
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

  goBack() {
    this.router.navigate(['/dashboard']);
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
    }

    else if (err?.error?.details && typeof err.error.details === 'object') {
      message = Object.values(err.error.details)
        .map((msg: any) => `${msg}`)
        .join('\n');
    }

    else if (err?.error?.message) {
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

      console.log(' Notification params:', params);

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

// ---------- ADD TASK ----------
isNewTaskTimeDisabled(): boolean {
  return this.newTask?.allDay === true;
}

isNewTaskAllDayDisabled(): boolean {
  return !!this.newTask?.startTime || !!this.newTask?.endTime;
}

isNewEventTimeDisabled(): boolean {
  return this.newEvent?.allDay === true;
}
isNewEventAllDayDisabled(): boolean {
  return !!this.newEvent?.startTime || !!this.newEvent?.endTime;
}
isEditTaskTimeDisabled(): boolean {
  return this.editTaskModel?.allDay === true;
}
isEditTaskAllDayDisabled(): boolean {
  return !!this.editTaskModel?.startTime || !!this.editTaskModel?.endTime;
}
isEditEventTimeDisabled(): boolean {
  return this.editEventModel?.allDay === true;
}
isEditEventAllDayDisabled(): boolean {
  return !!this.editEventModel?.startTime || !!this.editEventModel?.endTime;
}
onNewTaskAllDayChange() {
  if (this.newTask.allDay) {
    this.newTask.startTime = null;
    this.newTask.endTime = null;
  }
}
onEditTaskAllDayChange() {
  if (this.editTaskModel.allDay) {
    this.editTaskModel.startTime = null;
    this.editTaskModel.endTime = null;
  }
}
onEditEventAllDayChange() {
  if (this.editEventModel.allDay) {
    this.editEventModel.startTime = null;
    this.editEventModel.endTime = null;
  }
}

}
