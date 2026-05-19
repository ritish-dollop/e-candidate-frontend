import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, ActivatedRouteSnapshot, Route, UrlSegment, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanMatch {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    return this.checkRole(route.data['roles']);
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean {
    return this.checkRole(route.data?.['roles']);
  }

  private checkRole(allowedRoles: string[]): boolean {
    const userRoles = this.auth.getUserRoles();

    const allowed = allowedRoles.some(role => userRoles.includes(role));

    if (!allowed) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
