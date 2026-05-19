import { Component, OnInit } from '@angular/core';
import { Task } from '../../../../customer-portal/models/Task.model';
import { TaskService } from '../../../../customer-portal/services/task.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import Swal from 'sweetalert2';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tasklist',
  imports: [CommonModule],
  templateUrl: './tasklist.component.html',
  styleUrl: './tasklist.component.css'
})
export class TasklistComponent implements OnInit {

  tasks: Task[] = [];
  customerId!: number;
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  constructor(private taskService: TaskService, private auth: AuthService, private route: ActivatedRoute,private notificationSocket: NotificationSocketService) { }

  private notificationSub?: Subscription;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('customerId');
      console.log('Route param customerId =', id);
      this.customerId = Number(id);
    });
    // this.roles = this.auth.getUserRoles();
    this.loadTasks();
    // 🔥 REALTIME TASK ASSIGN LISTENER
  this.notificationSub =
    this.notificationSocket.notification$.subscribe(n => {
      if (!n) return;
      if (n.type === 'TASK_ASSIGNED' && n.entityType === 'TASK') {
        console.log('🆕 New task assigned → reload task list');
        this.loadTasks();
      }
      if (n.type === 'TASK_COMPLETED') {
        this.loadTasks();
      }
      if (n.type === 'TASK_DELETED' && n.entityType === 'TASK') {
      console.log('🗑 Task deleted → reload task list');
      this.loadTasks();
    }
    });
  }
  loadTasks() {
    this.taskService.getTasksByCustomer(this.customerId, this.page, this.size).subscribe(tasks => {
      this.tasks = tasks.content; 
      this.totalPages = tasks.totalPages;
      this.totalElements = tasks.totalElements;

      const calendarEvents = [
        ...tasks.map((t: Task) => ({
          id: t.id,
          title: t.title,
          start: t.startTime ? new Date(`${t.startDate}T${t.startTime}`) : new Date(`${t.startDate}T00:00`),
          end: t.endTime ? new Date(`${t.endDate}T${t.endTime}`) : new Date(`${t.endDate}T23:59`),
          type: 'task',
        })),
      ]
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
          Swal.fire({
            icon: 'success',
            title: 'Completed',
            text: 'Task marked as completed!',
            timer: 1500,
            showConfirmButton: false,
          });
          // 🔔 SAME LOGIC AS CALENDAR COMPONENT
      const creatorId =
        task.createdByUserId ??
        task.createdByCustomerUserId ??
        task.createdByBranchUserId;

      if (creatorId) {
        this.notificationSocket.emit('send_notification', {
          title: 'Task Completed',
          message: `Your task "${task.title}" has been marked as completed.`,
          type: 'TASK_COMPLETED',
          entityType: 'TASK',
          entityId: task.id,
          recipientId: creatorId,
          recipientType: task.createdByCustomerUserId
            ? 'CUSTOMER_USER'
            : task.createdByUserId
              ? 'AGENCY_USER'
              : 'BRANCH_USER',
        });
      }

      // 🔄 Refresh list instantly
      this.loadTasks();
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
}
