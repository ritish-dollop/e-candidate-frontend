import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LeadService } from '../../../../customer-portal/services/lead.service';
import { CampaignService } from '../../../../customer-portal/services/campaign.service';

import { Lead } from '../../../../customer-portal/models/Lead.model';
import { Campaign } from '../../../../customer-portal/models/Campaign.model';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidates.component.html',
  styleUrls: ['./candidates.component.css'],
})
export class CandidatesComponent {

  leads: Lead[] = [];
  loading = true;

  currentPage = 0;
  pageSize = 12;
  totalPages = 0;

  campaignCompanyMap: Record<number, { name: string; logo: string }> = {};

  constructor(
    private leadService: LeadService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loadCampaignCompanyMap();
    this.loadLeads();
  }

  loadCampaignCompanyMap(): void {

  this.campaignService.getAllCampaigns().subscribe({
    next: (campaigns: Campaign[]) => {
      console.log(' Campaigns received from backend:', campaigns);

      campaigns.forEach(c => {
        this.campaignCompanyMap[c.id] = {
          name: c.customerName,
          logo: c.customerLogo || 'assets/images/svg-img/E.svg'
        };
      });

      console.log(' Final campaignCompanyMap:', this.campaignCompanyMap);
    },
    error: err => {
      console.error(' Error loading campaigns', err);
    }
  });
}


  loadLeads(): void {
  this.loading = true;

  this.leadService
    .getLeadsPaginated(this.currentPage, this.pageSize)
    .subscribe({
      next: (res: any) => {

        this.leads = res.content.map((l: any) => ({
          ...l,
          campaign_id: l.campaignId
        }));

        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error(' Error fetching leads:', err);
        this.loading = false;
      }
    });
}

  getCompanyName(campaignId: number | string): string {
  const id = Number(campaignId);
  return this.campaignCompanyMap[id]?.name || 'Company';
}

getCompanyLogo(campaignId: number) {
  console.log(campaignId, this.campaignCompanyMap[campaignId]);
  return this.campaignCompanyMap[campaignId]?.logo || 'assets/images/svg-img/E.svg';
}

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLeads();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLeads();
    }
  }
}