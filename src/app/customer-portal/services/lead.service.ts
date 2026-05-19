import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LeadService {

  private updateLeadCallSource = new Subject<void>();
  abcCall$ = this.updateLeadCallSource.asObservable();

  updateLeadsCall() {
    console.log('0000000000000000000');
    this.updateLeadCallSource.next();
  }

  private baseUrl = `${environment.apiUrl}/api/leads`;

  constructor(private http: HttpClient) { }
  header = new HttpHeaders().set('content-type', 'application/json')

  // 1️⃣ Create Lead
  createLead(lead: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, lead);
  }

  // 2️⃣ Update Lead
  updateLead(id: number, lead: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, lead);
  }

  // 3️⃣ Delete Lead
  deleteLead(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // 4️⃣ Get Lead By ID
  getLeadById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // 5️⃣ Get All Leads
  getAllLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`, { headers: this.header });
  }
  getLeadsPaginated(page: number, size: number) {
    return this.http.get(`${this.baseUrl}/paginate?page=${page}&size=${size}`);
  }

  // 6️⃣ Get Leads By Campaign
  getLeadsByCampaign(campaignId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}`);
  }
  getLeadsByCampaignPaged(campaignId: number, page: number, size: number) {
    return this.http.get<any>(
      `${this.baseUrl}/campaign/${campaignId}/paged?page=${page}&size=${size}`);
  }

  // 7️⃣ Search Leads in Campaign
  searchLeadsInCampaign(campaignId: number, keyword: string): Observable<any[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}/search`, { params });
  }

  // 8️⃣ Filter Leads by Date Range
  filterLeadsByDate(campaignId: number, start: string, end: string): Observable<any[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}/filter/date`, { params });
  }

  // 9️⃣ Filter Leads by Status
  filterLeadsByStatus(campaignId: number, status: string): Observable<any[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}/filter/status`, { params });
  }

  // 🔟 Change Lead Status
  changeLeadStatus(leadId: number, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.patch(`${this.baseUrl}/${leadId}/status`, {}, { params });
  }

  // 1️⃣1️⃣ Get Leads By Status
  getLeadsByStatus(status: string): Observable<any[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<any[]>(`${this.baseUrl}/status`, { params });
  }

  // 1️⃣2️⃣ Export Leads to Excel
  exportLeadsToExcel(campaignId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/campaign/${campaignId}/export/excel`, {
      responseType: 'blob'
    });
  }

  // 1️⃣3️⃣ Export Leads to CSV
  exportLeadsToCsv(campaignId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/campaign/${campaignId}/export/csv`, {
      responseType: 'blob'
    });
  }

  // 1️⃣4️⃣ Add Note to Lead
  addNoteToLead(leadId: number, content: string, userId: number): Observable<any> {
    const params = new HttpParams()
      .set('content', content)
      .set('userId', userId.toString());
    return this.http.post(`${this.baseUrl}/${leadId}/notes`, {}, { params });
  }

  // 1️⃣5️⃣ Delete Note from Lead
  deleteNoteFromLead(leadId: number, noteId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${leadId}/notes/${noteId}`);
  }

  // 1️⃣6️⃣ Upload Applicant File
  uploadApplicantFile(leadId: number, url: string): Observable<any> {
    const formData = new FormData();
    // formData.append('file', url);
    return this.http.post(`${this.baseUrl}/${leadId}/upload/resume`, null,   // No body required
      {
        params: new HttpParams().set('url', url)
      });
  }

  // 1️⃣7️⃣ Upload Customer File
  uploadCustomerFile(leadId: number, file: File, customerId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customerId', customerId.toString());
    return this.http.post(`${this.baseUrl}/${leadId}/upload/customer`, formData);
  }

  // 1️⃣8️⃣ Get All Files of Lead
  getAllFilesOfLead(leadId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${leadId}/files`);
  }

  // 1️⃣9️⃣ Add Task to Lead
  addTaskForLead(leadId: number, assignedToId: number, title: string, description: string, dueDate: string): Observable<any> {
    const params = new HttpParams()
      .set('assignedToId', assignedToId.toString())
      .set('title', title)
      .set('description', description)
      .set('dueDate', dueDate);
    return this.http.post(`${this.baseUrl}/${leadId}/tasks`, {}, { params });
  }

  // 2️⃣0️⃣ Get Leads with Upcoming Tasks
  getLeadsWithUpcomingTasks(date: string): Observable<any[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<any[]>(`${this.baseUrl}/tasks/upcoming`, { params });
  }

  // 2️⃣1️⃣ Get Overdue Leads
  getOverdueLeads(campaignId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}/overdue`);
  }

  // 2️⃣2️⃣ Get New Leads
  getNewLeads(campaignId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaign/${campaignId}/new`);
  }

  // 2️⃣3️⃣ Count Total Leads
  countTotalLeads(campaignId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/campaign/${campaignId}/count`);
  }

  // 2️⃣4️⃣ Count Leads by Status
  countLeadsByStatus(campaignId: number, status: string): Observable<number> {
    const params = new HttpParams().set('status', status);
    return this.http.get<number>(`${this.baseUrl}/campaign/${campaignId}/count/status`, { params });
  }

  deleteLeadFile(leadId: number, fileUrl: string) {
    return this.http.delete(
      `${this.baseUrl}/${leadId}/file`,
      {
        params: { fileUrl: fileUrl },
        responseType: 'text'   // 🔥 IMPORTANT FIX
      }
    );
  }



  downloadLeadFile(leadId: number, fileUrl: string) {

    return this.http.get(
      `${this.baseUrl}/${leadId}/file`,
      {
        params: {
          fileUrl: encodeURIComponent(fileUrl)
        },
        responseType: 'text'
      }
    );
  }

  getCampaignCounts(campaignId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/campaign/${campaignId}/counts`
    );
  }

}
