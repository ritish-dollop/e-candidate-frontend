import { Injectable } from '@angular/core';
import { CanMatch, Router, Route, UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanMatch {
  constructor(private auth: AuthService, private router: Router) {}

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    return this.auth.isLoggedIn() ? true : this.router.createUrlTree(['/auth/login']);
  }
}


