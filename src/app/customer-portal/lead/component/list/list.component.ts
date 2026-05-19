import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeadService } from '../../../services/lead.service';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Lead } from '../../../models/Lead.model';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  leads: Lead[] = [];
  loading = true;

  // Pagination variables
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;

  constructor(private leadService: LeadService) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.leadService.getLeadsPaginated(this.currentPage, this.pageSize)
      .subscribe({
        next: (res: any) => {
          this.leads = res.content;
          this.totalPages = res.totalPages;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error fetching leads:', err);
          this.loading = false;
        }
      });
  }

  // Go to previous page
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLeads();
    }
  }

  // Go to next page
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLeads();
    }
  }
}
