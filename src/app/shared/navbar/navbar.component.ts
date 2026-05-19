import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationComponent } from '../../customer-portal/shared/notification/notification.component';
import { NotificationService } from '../../customer-portal/services/notification.service';
import { UserResponse } from '../../agency-portal/interfaces/user-request';
import { NotificationSocketService } from '../../socket-services/notificationSocket.service';
import { CustomerRolePipe } from '../../customer-portal/Pipe/customer-role.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, NotificationComponent,CustomerRolePipe],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @ViewChild('notificationCmp') notificationComponent?: NotificationComponent;
  // componenetRoutes=ComponentsRoutes;
  defaultProfileImage = 'assets-1/images/svg-img/user-icon.svg';
  user !: UserResponse
   private socketSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private location: Location,
    private notificationSocket: NotificationSocketService
  ) { }

  // ngOnInit(): void {}

  notificationCount = 0;
  isDarkMode: boolean = false;
  isProfileOpen = false;

  ngOnInit(): void {
    this.initTheme();
  this.loadCurrentUserAndInitNotifications();

  }

  private loadUnreadNotificationCount(): void {
  const role = localStorage.getItem('role');

  if (!role) return;

  let recipientType: 'CUSTOMER_USER' | 'AGENCY_USER' | 'BRANCH_USER' | null = null;
  let recipientId: number | null = null;

  if (role.startsWith('CUSTOMER')) {
    recipientType = 'CUSTOMER_USER';
    recipientId = Number(localStorage.getItem('customerUserId'));
  } else if (role.startsWith('AGENCY')) {
    recipientType = 'AGENCY_USER';
    recipientId = Number(localStorage.getItem('userId'));
  } else if (role.startsWith('BRANCH')) {
    recipientType = 'BRANCH_USER';
    recipientId = Number(localStorage.getItem('branchUserId'));
  }

  // 🔒 FINAL GUARD
  if (!recipientType || !recipientId || recipientId <= 0) {
    console.warn('⛔ Invalid recipient params', recipientType, recipientId);
    return;
  }

  this.notificationService
    .getUnreadCount(recipientType, recipientId)
    .subscribe(count => {
      this.notificationCount = count ?? 0;
    });
}


  openNotification(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = false;
    this.notificationComponent?.loadOnOpen();

    this.notificationComponent?.open();
  }

  private loadCurrentUserAndInitNotifications(): void {
  this.authService.getCurrentUser().subscribe({
    next: (user) => {
      if (!user || !user.id || !user.role) return;

      this.user = user;

      // 🔐 SET CONTEXT
      localStorage.setItem('role', user.role);
      localStorage.setItem('userId', String(user.id));

      // ✅ STEP 1: LOAD UNREAD COUNT FIRST
      this.loadUnreadNotificationCount();

      // ✅ STEP 2: CONNECT SOCKET IMMEDIATELY
      this.connectNotificationSocket(user);
    },
    error: (err) => {
      console.error('Failed to load current user', err);
    }
  });
}

private connectNotificationSocket(user: UserResponse): void {
    // 🔒 only agency users
    if (!user.role.startsWith('AGENCY')) return;

    console.log('🔌 Agency navbar socket connect =>', user.id);

    this.notificationSocket.connect(
      'AGENCY_USER',
      Number(user.id)
    );

    // ❗ SINGLE SUBSCRIPTION
    this.socketSub = this.notificationSocket.notification$
      .subscribe(notification => {
        console.log('🔔 Agency realtime notification:', notification);
        this.notificationCount++; // ✅ ONLY HERE COUNT INCREASES
      });
  }





  //theme
  private initTheme(): void {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : prefersDark
          ? 'dark'
          : 'light';

    this.applyTheme(initialTheme as 'dark' | 'light');
  }

  toggleTheme(): void {
    this.applyTheme(this.isDarkMode ? 'light' : 'dark');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this.isDarkMode = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
  }
  @HostListener('document:click')
  closeDropdown(): void {
    this.isProfileOpen = false;
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  back() {
    this.location.back()
  }
}