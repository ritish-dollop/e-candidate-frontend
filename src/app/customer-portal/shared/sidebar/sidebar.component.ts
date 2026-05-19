import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule,RouterLink,CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  roles: string[] = [];
  customerId!: number;
  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();  // decode roles from JWT
    const cid = this.auth.getCustomerId();

    if (!cid) {
      console.error('❌ customerId not found in sidebar');
      return;
    }

    this.customerId = cid;
    console.log('✅ Sidebar customerId:', this.customerId);
  }

  isAdmin(): boolean {
    return this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('BRANCH_ADMIN');
  }

  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER') || this.roles.includes('BRANCH_TEAM_MEMBER');
  }

  isCustomerUser(): boolean {
    return this.isAdmin() || this.isTeamMember();
  }
}
