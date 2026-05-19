import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../socket-services/socket.service';
import { UserResponse } from '../../agency-portal/interfaces/user-request';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css'],
})
export class VerifyOtpComponent implements OnInit {
  email: string = '';
  otp: string = '';
  source: string = '';
  password: string = '';

  otp1 = '';
  otp2 = '';
  otp3 = '';
  otp4 = '';
  loading = false;

  message = '';
  messageType: 'success' | 'error' | '' = '';

  // Timer
  timer = 0;
  interval: any;

  currentUser: UserResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    public router: Router,
    private socket: SocketService
  ) { }

  // 🔹 Load email & source
  ngOnInit(): void {
    const navigation = history.state;

    this.email = navigation.email || sessionStorage.getItem('otpEmail') || '';
    this.source =
      navigation.source || sessionStorage.getItem('otpSource') || 'login';
    this.password =
      navigation.password || sessionStorage.getItem('password') || '';

    if (!this.email) {
      this.showMessage('Session expired! Please login again.', 'error');
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      return;
    }

    sessionStorage.setItem('otpEmail', this.email);
    sessionStorage.setItem('otpSource', this.source);
    sessionStorage.setItem('password', this.password);

    this.startTimerFromBackend();
  }

  loadUser() {
    this.authService.getCurrentUser().subscribe({
      next: (res) => {
        this.currentUser = res;
        console.log('Logged User:', res);

        // cache customerId if present so other modules can reuse
        const customerId = res?.customerId || this.authService.getCustomerId();
        if (customerId) {
          localStorage.setItem('customerId', String(customerId));
        }

        // SOCKET CONNECT
        this.socket.connect(this.currentUser?.email || '');

        // ⭐ ROLE-BASED REDIRECT
        setTimeout(() => {
          const roles = this.authService.getUserRoles();
          console.log('User Roles After OTP:', roles);

          const roleRouteMap: Record<string, string> = {
            // Roles with ROLE_ prefix
            ROLE_AGENCY_SUPER_ADMIN: '/agency',
            ROLE_AGENCY_ADMIN: '/agency',
            ROLE_AGENCY_TEAM_MEMBER: '/agency',
            ROLE_CUSTOMER_ADMIN: '/customer',
            ROLE_CUSTOMER_TEAM_MEMBER: '/customer',
            ROLE_AGENCY_RELATIONSHIP_MANAGER: '/agency',
            ROLE_BRANCH_ADMIN: '/customer',
            ROLE_BRANCH_TEAM_MEMBER: '/customer',
            // Roles without ROLE_ prefix
            AGENCY_SUPER_ADMIN: '/agency',
            AGENCY_ADMIN: '/agency',
            AGENCY_TEAM_MEMBER: '/agency',
            CUSTOMER_ADMIN: '/customer',
            CUSTOMER_TEAM_MEMBER: '/customer',
            AGENCY_RELATIONSHIP_MANAGER: '/agency',
            BRANCH_ADMIN: '/customer',
            BRANCH_TEAM_MEMBER: '/customer',
          };

          const matchedRole = roles.find((role) => roleRouteMap[role]);
          const target = matchedRole ? roleRouteMap[matchedRole] : '/home';

          this.router.navigate([target]);
        }, 500);
      },
      error: (err) => {
        console.log('Failed to load user ==' + err);
        this.router.navigate(['/auth/login']);
      },
    });
  }

  // Only numbers allowed
  allowOnlyNumbers(event: KeyboardEvent) {
    if (event.key < '0' || event.key > '9') event.preventDefault();
  }

  autoFocusNext(event: any, next: number) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value && next <= 4) {
      const nextInput = document.querySelectorAll('.otp_field')[
        next - 1
      ] as HTMLElement;
      nextInput.focus();
    }
  }

  // Combine OTP digits
  combineOtp() {
    this.otp = this.otp1 + this.otp2 + this.otp3 + this.otp4;

    if (this.otp.length !== 4) {
      this.showMessage('Please enter 4-digit OTP', 'error');
      return;
    }
    this.onVerify();
  }

  resetOtpField() {
    this.otp1 = '';
    this.otp2 = '';
    this.otp3 = '';
    this.otp4 = '';
    this.otp = ''
  }

  // MAIN OTP VERIFY
  onVerify() {
    this.loading = true;
    this.message = '';

    this.authService
      .verifyOtp({ email: this.email, otp: this.otp, type: this.source })
      .subscribe({
        next: (res) => {
          console.log('OTP Verify Response:', res);

          if (res.status === 'LOGIN_SUCCESS') {
            // Save token FIRST
            this.authService.saveToken(res.token);

            this.showMessage('Login Successful! Redirecting...', 'success');

            // Load user → Connect socket → Navigate
            setTimeout(() => this.loadUser(), 300);

            sessionStorage.removeItem('otpEmail');
            sessionStorage.removeItem('otpSource');
            return;
          }

          if (this.source === 'FORGOT_PASSWORD_OTP') {
            this.showMessage('OTP Verified! Redirecting...', 'success');
            setTimeout(() => {
              this.router.navigate(['/auth/new_password'], {
                state: { email: this.email },
              });
            }, 800);
            return;
          }

          this.showMessage('Invalid OTP. Try again.', 'error');
        },
        error: (err) => {

          console.log(err);
          this.loading = false
          const msg = err.error?.message || 'Invalid/expired OTP';
          this.showMessage(msg, 'error');
        },
        complete: () => {
          (this.loading = false),
          this.resetOtpField();
        },
      });
    // this.loading = false;
  }

  resend = false
  // Resend OTP
  resendOtp() {
    if (this.timer > 0 || this.resend) return;

    this.resend = true;
    this.resetOtpField();
    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        console.log(res);

        sessionStorage.setItem('otpExpiry', res.otpExpiry);
        this.showMessage('New OTP sent!', 'success');
        this.startTimerFromBackend();
        this.resend = false; // ✅ FIX
      },
      error: () => {
        this.showMessage('Failed to resend OTP.', 'error');
        this.resend = false;
      }
    });
  }


  // Timer
  startTimerFromBackend() {
    const expiry = sessionStorage.getItem('otpExpiry');
    if (!expiry) {
      this.timer = 0;
      return;
    }

    const expiryTime = new Date(expiry).getTime();

    this.interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expiryTime - now) / 1000);

      if (diff > 0) {
        this.timer = diff;
      } else {
        this.timer = 0;
        clearInterval(this.interval);
        sessionStorage.removeItem('otpExpiry');
      }
    }, 1000);
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 3500);
  }
  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

}
