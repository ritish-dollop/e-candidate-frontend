import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // ✅ import your service

  @Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css']
  })
  export class ForgotPasswordComponent {
    email: string = '';
    loading: boolean = false;

    message: string = '';                      // ✅ to show success/error message
    messageType: 'success' | 'error' | '' = ''; // ✅ message color

    constructor(private authService: AuthService, private router: Router) {}

    onSendOtp() {
      if (!this.email.trim()) {
        this.showMessage('Please enter your email address.', 'error');
        return;
      }

      this.loading = true;
      this.message = '';

      this.authService.sendOtp(this.email).subscribe({
        next: (res) => {
          console.log('✅ OTP sent successfully:', res);
           sessionStorage.setItem('otpExpiry', res.otpExpiry);
          this.showMessage('OTP sent successfully to your email.', 'success');


          setTimeout(() => {
            this.router.navigate(['/auth/verify'], {
              state: { email: res.email, source: res.status },
              replaceUrl: true
            });
          }, 800);
        },
        error: (err) => {
          console.error('❌ Error sending OTP:', err);

          const backendMsg =
          err.error?.message ||
          err.error?.error ||
          'Failed to send OTP. Please try again.';

          this.showMessage(backendMsg, 'error');
          this.loading = false;
        },
        complete: () => (this.loading = false)
      });
    }

    /** ✅ Reusable message display function */
    showMessage(msg: string, type: 'success' | 'error') {
      this.message = msg;
      this.messageType = type;

      setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 4000);
    }
  }
