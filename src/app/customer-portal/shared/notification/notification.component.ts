import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { Offcanvas } from 'bootstrap';
import { Subscription } from 'rxjs';

import { NotificationResponseDto } from '../../models/Notification.model';
import { NotificationSocketService } from '../../../socket-services/notificationSocket.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {

  @Output() clearAll = new EventEmitter<void>();
  @Output() notificationsChange = new EventEmitter<number>();

  @ViewChild('notificationOffcanvas')
  notificationOffcanvas?: ElementRef<HTMLElement>;

  private offcanvasInstance?: Offcanvas;
  private socketSub?: Subscription;

  notifications: NotificationResponseDto[] = [];

  private recipientType!: string;
  private recipientId!: number;

  private clearing = false;

  constructor(
    private notificationSocket: NotificationSocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.resolveRecipient();
    // this.loadNotifications();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.socketSub?.unsubscribe();
    this.notificationSocket.disconnect();
  }

  loadOnOpen(): void {
    this.resolveRecipient();

    this.notificationService
      .getNotifications(this.recipientType, this.recipientId)
      .subscribe(list => {
        this.notifications = list || [];
        // this.notificationsChange.emit(this.notifications.length);
      });
  }

  private resolveRecipient(): void {
    const role = localStorage.getItem('role');

    if (role?.startsWith('CUSTOMER')) {
      this.recipientType = 'CUSTOMER_USER';
      this.recipientId = Number(localStorage.getItem('customerUserId'));
    }

    if (role?.startsWith('AGENCY')) {
      this.recipientType = 'AGENCY_USER';
      this.recipientId = Number(localStorage.getItem('userId'));
    }

    if (role?.startsWith('BRANCH')) {
      this.recipientType = 'BRANCH_USER';
      this.recipientId = Number(localStorage.getItem('branchUserId'));
    }
    console.log(
    ' Notification connect =>',
    this.recipientType,
    this.recipientId
  );
  }
  private loadNotifications(): void {
    this.notificationService
      .getNotifications(this.recipientType, this.recipientId)
      .subscribe(list => {
        this.notifications = list || [];
        this.notificationsChange.emit(this.notifications.length);
      });
  }
  private connectSocket(): void {
    this.notificationSocket.connect(
      this.recipientType,
      this.recipientId
    );

    this.socketSub = this.notificationSocket.notification$
      .subscribe(notification => {
        this.addNotification(notification);
      });
  }

  open(): void {
    if (!this.notificationOffcanvas) return;

    if (!this.offcanvasInstance) {
      this.offcanvasInstance = new Offcanvas(
        this.notificationOffcanvas.nativeElement
      );
    }

    this.offcanvasInstance.show();
  }

  close(): void {
    this.offcanvasInstance?.hide();
  }

  get visibleNotifications(): NotificationResponseDto[] {
    return this.notifications;
  }

  addNotification(notification: NotificationResponseDto): void {
    if (this.clearing) return;
    const normalize = (msg?: string | null) =>
      (msg || '')
        .replace(/["']/g, '')
        .trim()
        .toLowerCase();

    const isDuplicate = this.notifications.some(n =>
      n.type === notification.type &&
      n.recipientId === notification.recipientId &&
      normalize(n.message) === normalize(notification.message)
    );

    if (isDuplicate) return;

    this.notifications.unshift({
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    });

    this.notificationsChange.emit(this.notifications.length);
  }

  markAsRead(notification: NotificationResponseDto): void {
    notification.readStatus = true;
    // later: this.notificationService.markAsxRead(notification.id).subscribe();
  }
  handleClearAll(): void {
    this.clearing = true;
    this.notificationService
      .clearAll(this.recipientType, this.recipientId)
      .subscribe(() => {
        this.notifications = [];
        this.notificationsChange.emit(0);
        this.clearAll.emit();
      });
  }
  handleNotificationClick(notification: NotificationResponseDto): void {
  notification.readStatus = true;
  this.close();

  if (notification.entityType === 'TASK' && notification.entityId) {
    this.router.navigate(
      ['/home/taskcalender'],
      {
        queryParams: {
          taskId: notification.entityId,
          openTab: 'task'
        }
      }
    );
  }

  if (notification.entityType === 'EVENT' && notification.entityId) {
    this.router.navigate(
      ['/home/taskcalender'],
      {
        queryParams: {
          eventId: notification.entityId,
          openTab: 'event'
        }
      }
    );
  }
}

}
