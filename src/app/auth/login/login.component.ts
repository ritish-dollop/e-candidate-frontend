import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';

import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginData = { email: '', password: '' };
  showPassword = false;

  message = '';
  messageType: 'success' | 'error' | '' = '';
  loading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}
  ngOnInit(): void {
    const navigation = history.state;
    const email = navigation.email || '';
    const pass = navigation.password || '';

    if (email && pass) {
      this.loginData.email = email;
      this.loginData.password = pass;
    }
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.showMessage('Please enter both email and password.', 'error');
      return;
    }
    this.loading = true;
    this.message = '';

    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        console.log('✅ Backend Response:', res);
        sessionStorage.setItem('otpExpiry', res.otpExpiry);
        this.showMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          this.router.navigate(['/auth/verify'], {
            state: {
              email: res.email,
              password: this.loginData.password,
              source: res.status,
            },
            replaceUrl: true,
          });
        }, 800);
      },
      error: (err) => {
        console.error('❌ API Error:', err);

        let message = 'Something went wrong. Please try again.';

        // 1️⃣ Validation errors (DTO / @Valid)
        if (err.status === 400 && err.error?.details) {
          const errors = err.error.details;
          message = Object.values(errors)[0] as string;
        }

        // 2️⃣ Backend custom message
        else if (err.error?.message) {
          message = err.error.message;
        }

        // 3️⃣ Server error
        else if (err.status === 500) {
          message = 'Internal Server Error. Please try again later.';
        }

        this.showMessage(message, 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // ✅ Reusable message display
  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 4000);
  }
}
