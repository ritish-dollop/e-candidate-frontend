import { Component } from '@angular/core';
import { CampaignService } from '../../../services/campaign.service';

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Campaign } from '../../../models/Campaign.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { LeadService } from '../../../services/lead.service';

@Component({
  selector: 'app-list-campaigns',
  imports: [CommonModule,RouterLink,FormsModule],
  templateUrl: './list-campaigns.component.html',
  styleUrl: './list-campaigns.component.css'
})
export class ListCampaignsComponent {
  campaigns: Campaign[] = [];
  loading = true;
  errorMessage = '';
  roles: string[] = [];
  customerId! : number;
  searchText: string = '';
  constructor(private campaignService: CampaignService, private router:Router,private auth: AuthService,private leadService : LeadService) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    const cid = this.auth.getCustomerId();

    if (cid === null) {
      console.error('❌ customerId not found');
      return;
    }

    this.customerId = cid;
    console.log('✅ customerId:', this.customerId);
    this.fetchCampaignsByCustomer();
  }

  isAdmin(): boolean {
    return this.roles.includes('CUSTOMER_ADMIN') || this.roles.includes('BRANCH_ADMIN');
  }

  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }

  fetchCampaignsByCustomer(): void {
    if (!this.customerId) {
      console.error('❌ customerId undefined, API call skipped');
      return;
    }
    this.loading = true;

    this.campaignService.getCampaignsByCustomer(this.customerId).subscribe({
      next: (data) => {
        console.log('✅ customerId before API:', this.customerId);
        this.campaigns = data;

        this.campaigns.forEach(campaign => {
        this.leadService.getCampaignCounts(campaign.id)
          .subscribe(res => {
            campaign.overdueCount = res.overdue;
            campaign.unaddressedCount = res.unedited;
          });
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching campaigns:', err);
        this.errorMessage = 'Failed to load campaigns. Please try again later.';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    // 🔁 Agar search empty hai → normal list
    if (!this.searchText || this.searchText.trim() === '') {
      this.fetchCampaignsByCustomer();
      return;
    }

    this.loading = true;

    this.campaignService.searchCampaigns(this.searchText).subscribe({
      next: (data) => {
        // 🔥 Optional: customerId ke hisaab se filter
        this.campaigns = data.filter(
          c => c.customerId === this.customerId
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading = false;
      }
    });
  }

openLeadsDetails(campaignId: number, campaignName: string): void {
  console.log('📁 Opening leads for campaign:', campaignId, campaignName);

  // Navigate to leads details inside the customer portal
  this.router.navigate(['/home/campaign/details', campaignId], {
    state: {
      campaignId: campaignId,
      campaignName: campaignName
    }
  });
}

handleClick(campaign: Campaign) {
  if (campaign.status?.toUpperCase() !== 'ACTIVE') {
    return;
  }
  this.openLeadsDetails(campaign.id, campaign.name);
}



  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'pending_status';
      case 'ACTIVE': return 'active_status';
      case 'INACTIVE': return 'inactive_status';
      case 'IN_PROGRESS': return 'inprogress_status';
      default: return 'unknown_status';
    }
  }
  

}

