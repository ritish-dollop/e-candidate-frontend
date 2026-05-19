import { Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { RoleGuard } from './guard/role.guard';

export const routes: Routes = [
  // Default route
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // CUSTOMER PORTAL HOME
  {
    path: 'home',
    canMatch: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER_ADMIN', 'CUSTOMER_TEAM_MEMBER', 'BRANCH_ADMIN', 'BRANCH_TEAM_MEMBER'] },
    loadChildren: () =>
      import('./customer-portal/home/home.module').then((m) => m.HomeModule),
  },

  // CUSTOMER alias
  {
    path: 'customer',
    canMatch: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER_ADMIN', 'CUSTOMER_TEAM_MEMBER', 'BRANCH_ADMIN', 'BRANCH_TEAM_MEMBER'] },
    loadChildren: () =>
      import('./customer-portal/home/home.module').then((m) => m.HomeModule),
  },

  // AGENCY PORTAL HOME
 {
    path: 'agency',
    canMatch: [AuthGuard, RoleGuard],
    data: {
      roles: [
        'AGENCY_ADMIN',
        'AGENCY_TEAM_MEMBER',
        'AGENCY_RELATIONSHIP_MANAGER',
        'AGENCY_SUPER_ADMIN'
      ]
    },
    loadChildren: () =>
      import('./home/home.module')
        .then(m => m.HomeModule),
  },

  // SUPER ADMIN DASHBOARD
  {
    path: 'dash',
    canMatch: [AuthGuard, RoleGuard],
    data: { roles: ['AGENCY_SUPER_ADMIN'] },
    loadChildren: () =>
      import('./agency-portal/agency-portal.module').then((m) => m.AgencyPortalModule),
  },

  // AUTH ROUTES
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then((m) => m.AuthModule),
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' },
];
