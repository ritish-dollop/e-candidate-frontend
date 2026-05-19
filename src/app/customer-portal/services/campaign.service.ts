  import { Injectable } from '@angular/core';
  import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
  import { Observable } from 'rxjs';
import { Campaign } from '../models/Campaign.model';
 

  @Injectable({
    providedIn: 'root'
  })
  export class CampaignService {

    private baseUrl = 'http://localhost:8080/api/campaigns';  // ✅ same as backend

    constructor(private http: HttpClient) {}
      header = new HttpHeaders().set('content-type','application/json');

    // ✅ 1. Create Campaign
    createCampaign(campaign: any): Observable<Campaign> {
      return this.http.post<Campaign>(`${this.baseUrl}`, campaign);
    }

    // ✅ 2. Update Campaign
    updateCampaign(campaignId: number, campaign: any): Observable<Campaign> {
      return this.http.put<Campaign>(`${this.baseUrl}/${campaignId}`, campaign);
    }

    // ✅ 3. Get Campaign by ID
    getCampaignById(campaignId: number): Observable<Campaign> {
      return this.http.get<Campaign>(`${this.baseUrl}/${campaignId}`,{headers:this.header});
    }

    // ✅ 4. Get All Campaigns
    getAllCampaigns(): Observable<Campaign[]> {
      return this.http.get<Campaign[]>(`${this.baseUrl}/getall`);
    }

    // ✅ 5. Get Campaigns by Customer ID
    getCampaignsByCustomer(customerId: number): Observable<Campaign[]> {
      return this.http.get<Campaign[]>(`${this.baseUrl}/customer/${customerId}`);
    }

    // ✅ 6. Change Campaign Status
    changeCampaignStatus(campaignId: number, newStatus: string): Observable<Campaign> {
      const params = new HttpParams().set('newStatus', newStatus);
      return this.http.patch<Campaign>(`${this.baseUrl}/${campaignId}/status`, {}, { params });
    }

    // ✅ 7. Soft Delete Campaign
    deleteCampaign(campaignId: number): Observable<void> {
      return this.http.delete<void>(`${this.baseUrl}/${campaignId}`);
    }

    // ✅ 8. Get Campaigns by Status
    getCampaignsByStatus(status: string): Observable<Campaign[]> {
      return this.http.get<Campaign[]>(`${this.baseUrl}/status/${status}`);
    }

    // ✅ 9. Get All Active Campaigns
    getActiveCampaigns(): Observable<Campaign[]> {
      return this.http.get<Campaign[]>(`${this.baseUrl}/active`);
    }

    // ✅ 10. Count Campaigns by Status
    countCampaignsByStatus(status: string): Observable<number> {
      const params = new HttpParams().set('status', status);
      return this.http.get<number>(`${this.baseUrl}/count`, { params });
    }
    searchCampaigns(keyword: string) {
  return this.http.get<any[]>(
    `${this.baseUrl}/search`,
    {
      params: { keyword },
      
    }
  );
}
getCampaignsByCustomerPaginated(
  customerId: number,
  page: number,
  size: number
): Observable<any> {

  return this.http.get<any>(
    `${this.baseUrl}/customer/${customerId}/paginated?page=${page}&size=${size}`
  );
}

}
