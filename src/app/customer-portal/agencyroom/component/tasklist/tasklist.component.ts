import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Task } from '../../../models/Task.model';
import Swal from 'sweetalert2';
import { UserService } from '../../../../agency-portal/services/user-service/user.service';
import { UserResponse } from '../../../../agency-portal/interfaces/user-request';
import { CompanyuserService } from '../../../services/companyuser.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { BranchService } from '../../../services/branch.service';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';
export interface CreateTaskRequest {
  title: string;
  description: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedToId?: number;
  agencyId: number;
  customerId?: number;
  createdByCustomerUserId?: number;
  createdByBranchUserId?: number;
}

@Component({
  selector: 'app-tasklist',
  imports: [FormsModule, CommonModule],
  templateUrl: './tasklist.component.html',
  styleUrl: './tasklist.component.css'
})
export class TasklistComponent implements OnInit {

  tasks: Task[] = [];
  user: UserResponse[] = [];
  createdById!: number;
  agencyId!: number;
  roles: string[] = [];

  constructor(private taskService: TaskService, private userService: UserService, private companyuserService: CompanyuserService, private auth: AuthService, private branchService: BranchService,private notificationSocket: NotificationSocketService) { }

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
    agencyId: null
  };

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    // ✅ CUSTOMER USER SOCKET CONNECT (IMPORTANT)
  if (
    this.roles.includes('CUSTOMER_ADMIN') ||
    this.roles.includes('CUSTOMER_TEAM_MEMBER')
  ) {
    const customerUserId = Number(localStorage.getItem('customerUserId'));

    console.log('🔌 Connecting CUSTOMER_USER socket:', customerUserId);

    this.notificationSocket.connect('CUSTOMER_USER', customerUserId);

    this.notificationSocket.notification$.subscribe(notification => {
      console.log('🔔 Customer Notification:', notification);

      // ✅ TASK COMPLETED → INSTANT UPDATE
      if (
        notification?.type === 'TASK_COMPLETED' &&
        notification?.entityType === 'TASK'
      ) {
        console.log('✅ TASK_COMPLETED received → reload customer tasks');
        this.loadTasks();
      }
    });
    
  }
    if (this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('CUSTOMER_TEAM_MEMBER')) {
      const customerUserId = Number(localStorage.getItem('customerUserId'));
      this.createdById = customerUserId;

      this.companyuserService.getAgencyIdOfLoggedInCustomerUser().subscribe({
        next: (agencyId) => {
          this.agencyId = agencyId;
          this.loadAllUsers();
          this.loadTasks();
        }
      });

    }
    else if (this.roles.includes('BRANCH_ADMIN') || this.roles.includes('BRANCH_TEAM_MEMBER')) {
      const branchUserId = Number(localStorage.getItem('branchUserId'));
      this.createdById = branchUserId;

      this.branchService.getAgencyIdOfLoggedInBranchUser().subscribe({
        next: (agencyId) => {
          this.agencyId = agencyId;
          this.loadAllUsers();
          this.loadTasks();
        }
      });
    }
  }

  isBranchAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isBranchTeamMember(): boolean {
    return this.roles.includes('BRANCH_TEAM_MEMBER') || this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }
  loadAllUsers() {
    this.userService.getUsersByAgency(this.agencyId).subscribe({
      next: (users) => {
        this.user = users.filter(u =>
          u.role === 'AGENCY_RELATIONSHIP_MANAGER'
        );

        if (this.user.length > 0) {
          this.newTask.assignedToId = this.user[0].id;
        }
      },
      error: err => console.error(err)
    });
  }


  loadTasks() {
    let taskObservable;
    if (this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('CUSTOMER_TEAM_MEMBER')) {
      taskObservable = this.taskService.getTasksByAgency(this.agencyId);
    }
    else if (this.roles.includes('BRANCH_ADMIN') || this.roles.includes('BRANCH_TEAM_MEMBER')) {
      taskObservable = this.taskService.getBranchCreatedAgencyTasks(this.agencyId);
    }
    if (!taskObservable) return;

    taskObservable.subscribe(tasks => {
      this.tasks = tasks;

      const calendarEvents = [
        ...tasks.map(t => ({
          id: t.id,
          title: t.title,
          start: t.startTime ? new Date(`${t.startDate}T${t.startTime}`) : new Date(`${t.startDate}T00:00`),
          end: t.endTime ? new Date(`${t.endDate}T${t.endTime}`) : new Date(`${t.endDate}T23:59`),
          type: 'task',
        })),
      ]
    });
  }

  saveTask() {
    const taskRequest: CreateTaskRequest = {
      title: this.newTask.title,
      description: this.newTask.description,
      allDay: this.newTask.allDay,
      startDate: this.newTask.startDate,
      endDate: this.newTask.endDate,
      startTime: this.newTask.startTime || null,
      endTime: this.newTask.endTime || null,
      status: this.newTask.status,
      assignedToId: this.newTask.assignedToId,
      agencyId: this.agencyId,
      // customerId: Number(localStorage.getItem('customerId'))
    };

    // CUSTOMER USER
    if (this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('CUSTOMER_TEAM_MEMBER')) {
      taskRequest.customerId = Number(localStorage.getItem('customerId'));
      taskRequest.createdByCustomerUserId = this.createdById;
    }

    // BRANCH USER
    if (this.roles.includes('BRANCH_ADMIN') || this.roles.includes('BRANCH_TEAM_MEMBER')) {
      taskRequest.createdByBranchUserId = this.createdById;
    }

    this.taskService.addTask(taskRequest).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Task created successfully!',
          timer: 1500,
          showConfirmButton: false
        });
        this.loadTasks();
        this.resetTaskForm();
      },
      error: (err) => {
        console.error('❌ Task creation error:', err);
        this.showBackendValidationError(err, 'Task Creation Failed');
      }
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
      assignedToId: 1,
      agencyId: null
    };
  }

  ddeleteTask(task: Task) {
  if (!task || !task.id) {
    console.error('❌ Task missing');
    return;
  }

  // ✅ assignee info BEFORE delete
  const assigneeId =
    task.assignedToId ??
    task.assignedCustomerUserId ??
    task.assignedBranchUserId;

  const recipientType =
    task.assignedCustomerUserId
      ? 'CUSTOMER_USER'
      : task.assignedToId
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

    this.taskService.deleteTask(task.id!).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Task deleted successfully!',
          timer: 1500,
          showConfirmButton: false,
        });

        // 🔔 EXACT SAME PATTERN AS TaskCalenderComponent
        if (assigneeId) {
          this.notificationSocket.emit('send_notification', {
            title: 'Task Deleted',
            message: `Task "${task.title}" has been deleted.`,
            type: 'TASK_DELETED',
            entityType: 'TASK',
            entityId: task.id,
            recipientId: assigneeId,
            recipientType: recipientType,
          });
        }

        this.loadTasks();
      },
      error: (err) => {
        console.error('Delete Task Error:', err);
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Task ID missing!',
      });
      return;
    }
    const updatedTask = {
      ...task,
      status: 'COMPLETED',
    };
    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
      this.notificationSocket.emit('send_notification', {
        recipientType: 'AGENCY_USER',      
        recipientId: task.assignedToId,  
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as completed.`,
        referenceId: task.id,
        referenceType: 'TASK',
        createdAt: new Date()
      });
        Swal.fire({
          icon: 'success',
          title: 'Completed',
          text: 'Task marked as completed!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadTasks(); // Refresh list + refresh calendar
      },
      error: (err) => {
        this.showBackendValidationError(err, 'Task Update Failed');
      },

    });
  }

  private showBackendValidationError(err: any, title: string) {
    let message = 'Something went wrong!';
    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      message = err.error.errors
        .map((e: any) => e.defaultMessage)
        .join('\n');
    }
    else if (err?.error?.details && typeof err.error.details === 'object') {
      message = Object.values(err.error.details)
        .map((msg: any) => msg)
        .join('\n');
    }
    else if (err?.error?.message) {
      message = err.error.message;
    }
    Swal.fire({
      icon: 'error',
      title: title,
      html: message.replace(/\n/g, '<br>'),
      confirmButtonText: 'OK',
    });
  }

}
