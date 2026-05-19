import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationComponent } from '../notification/notification.component';
import { NotificationService } from '../../services/notification.service';
import { NotificationSocketService } from '../../../socket-services/notificationSocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule, FormsModule,NotificationComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
   @ViewChild('notificationCmp') notificationComponent?: NotificationComponent;
  defaultProfileImage = 'assets-1/images/svg-img/user-icon.svg';
  user = {
    name: 'Rashmi Rajput',
    email: 'yournamegmail.com',
    profileImage: this.defaultProfileImage,
  };

  isDarkMode = false;
  isProfileOpen = false;
  notificationCount = 0;
  private socketSub?: Subscription;
  campaignId: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private notificationSocket: NotificationSocketService
  ) {}

  showBackButton() {
    const url = this.router.url;
    return url !== '/campaign/list';
  }

  getBackUrl() {
    const url = this.router.url;

    if (url.includes('/campaign/single-lead-detail')) {
      return ['/campaign/details', localStorage.getItem('campaignId')];
    }

    return ['/campaign/list'];
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.initTheme();
    this.loadUnreadNotificationCount();
    this.connectNotificationSocket();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const state = history.state;
        if (state?.campaignId) {
          this.campaignId = state.campaignId;
          localStorage.setItem('campaignId', this.campaignId.toString());
        }

        if (!this.campaignId) {
          this.campaignId = Number(localStorage.getItem('campaignId'));
        }
      }
    });
  }
  private loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe({
      next: (res) => {
        this.user = {
          name: res?.name || res?.fullName || this.user.name,
          email: res?.email || this.user.email,
          profileImage:
            res?.profilePic ||
            res?.profilePicUrl ||
            res?.profilePicture ||
            res?.profileImage ||
            res?.avatarUrl ||
            this.defaultProfileImage,
        };
      },
      error: (err) => {
        console.error('Failed to load current user for navbar', err);
      },
    });
  }

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

  openNotification(event: Event): void {
   event.stopPropagation(); 
   this.isProfileOpen = false;
   this.notificationComponent?.loadOnOpen();

   this.notificationComponent?.open();
}
  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
  }
  @HostListener('document:click')
  closeDropdown(): void {
    this.isProfileOpen = false;
  }

  private loadUnreadNotificationCount(): void {
  const role = localStorage.getItem('role');
  let recipientType!: string;
  let recipientId!: number;
  if (role?.startsWith('CUSTOMER')) {
    recipientType = 'CUSTOMER_USER';
    recipientId = Number(localStorage.getItem('customerUserId'));
  }
  if (role?.startsWith('AGENCY')) {
    recipientType = 'AGENCY_USER';
    recipientId = Number(localStorage.getItem('userId'));
  }
  if (role?.startsWith('BRANCH')) {
    recipientType = 'BRANCH_USER';
    recipientId = Number(localStorage.getItem('branchUserId'));
  }
  this.notificationService
    .getUnreadCount(recipientType, recipientId)
    .subscribe(count => {
      this.notificationCount = count ?? 0;
    });
}



  logout(): void {
  Swal.fire({
    title: 'Logout Confirmation',
    text: 'Are you sure you want to logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Logout',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {

      this.authService.logout();

      this.socketSub?.unsubscribe();

      this.router.navigate(['/auth/login']);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Logged out successfully',
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}

   private connectNotificationSocket(): void {
    const role = localStorage.getItem('role');
    let recipientType!: string;
    let recipientId!: number;

    if (role?.startsWith('CUSTOMER')) {
      recipientType = 'CUSTOMER_USER';
      recipientId = Number(localStorage.getItem('customerUserId'));
    }
    if (role?.startsWith('AGENCY')) {
      recipientType = 'AGENCY_USER';
      recipientId = Number(localStorage.getItem('userId'));
    }
    if (role?.startsWith('BRANCH')) {
      recipientType = 'BRANCH_USER';
      recipientId = Number(localStorage.getItem('branchUserId'));
    }

    this.notificationSocket.connect(recipientType, recipientId);

    this.socketSub = this.notificationSocket.notification$
      .subscribe(() => {
        this.notificationCount++;
      });
  }
}
