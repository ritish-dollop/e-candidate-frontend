import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css']
})
export class NewPasswordComponent implements OnInit {
 email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  showPassword = false;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // ✅ Get email passed from VerifyOtp or sessionStorage
    const navigation = history.state;
    this.email = navigation.email || sessionStorage.getItem('otpEmail') || '';

    if (!this.email) {
      this.showMessage('Session expired! Please login again.', 'error');
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    }

    console.log('Reset password for:', this.email);
  }

  // ✅ Validate and Change Password
  onSetPassword() {
    if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.showMessage('Please fill all fields.', 'error');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showMessage('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('Passwords do not match!', 'error');
      return;
    }

    this.loading = true;
    this.message = '';

    this.authService.changePassword(this.email, this.newPassword).subscribe({
      next: (res) => {
        console.log('✅ Password reset successful:', res);
        this.showMessage('Password changed successfully! Redirecting...', 'success');

        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            state: { email: this.email, password: this.newPassword },
            replaceUrl: true
          });
        }, 700);
      },
error: (err) => {
  console.error('❌ Error resetting password:', err);

  let backendMsg = 'Failed to reset password. Please try again.';

  if (err.error?.details) {
    const errors = err.error.details;
    backendMsg = Object.values(errors)[0] as string; // first error
  } else if (err.error?.message) {
    backendMsg = err.error.message;
  }

  this.showMessage(backendMsg, 'error');
  this.loading = false;
},
      complete: () => (this.loading = false)
    });
  }

  // ✅ Inline message display
  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 4000);
  }
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
