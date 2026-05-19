import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobPost } from '../models/JobPost.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobpostService {

  private baseUrl = `${environment.apiUrl}/api/jobpost`;

  constructor(private http: HttpClient) { }

  getAllJobPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  createJobPost(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, formData);
  }

  getJobPostsByStatus(status: string): Observable<JobPost[]> {
    return this.http.get<JobPost[]>(`${this.baseUrl}/status/${status}`);
  }

  searchJobPosts(keyword: string) {
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params: { keyword } });
  }

  getMyJobPosts(page: number, size: number) {
    return this.http.get<any>(
      `${this.baseUrl}/my-jobposts`,
      { params: { page, size } }
    );
  }

  getJobPostsByCustomer(customerId: number): Observable<JobPost[]> {
    return this.http.get<JobPost[]>(
      `${this.baseUrl}/customer/${customerId}`
    );
  }

  updateJobPostStatus(jobPostId: number, status: 'APPROVED' | 'REJECTED') {
    return this.http.patch<any>(
      `${this.baseUrl}/${jobPostId}/status`,
      null,
      { params: { status } }
    );
  }

  getJobPostById(id: number): Observable<JobPost> {
    return this.http.get<JobPost>(`${this.baseUrl}/${id}`);
  }

}