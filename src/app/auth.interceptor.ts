import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth/services/auth.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (req.url.startsWith('https://api.cloudinary.com')) {
    return next(req);
  }

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
  catchError((error: HttpErrorResponse) => {

    if (
      error.status === 403 &&
      (error.error === 'ACCOUNT_DEACTIVATED' ||
       error.error?.message === 'ACCOUNT_DEACTIVATED')
    ) {

      authService.logout();

      Swal.fire({
        icon: 'warning',
        title: 'Account Deactivated',
        text: 'Your account has been deactivated. Contact admin.',
      }).then(() => {
        router.navigate(['/auth/login']);
      });
    }

    return throwError(() => error);
  })
);
};
