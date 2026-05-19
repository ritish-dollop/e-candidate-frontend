import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Branch } from '../models/Branch.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BranchService {

  private baseUrl = `${environment.apiUrl}/api/branches`;

  constructor(private http: HttpClient) {}

  getAll(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  getById(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.baseUrl}/${id}`);
  }

  create(branch: Branch): Observable<Branch> {
    return this.http.post<Branch>(this.baseUrl, branch);
  }

  update(id: number, branch: Branch): Observable<Branch> {
    return this.http.put<Branch>(`${this.baseUrl}/${id}`, branch);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  changeStatus(id: number, status: string): Observable<Branch> {
    return this.http.put<Branch>(`${this.baseUrl}/${id}/status/${status}`, {});
  }

  getAgencyIdOfLoggedInBranchUser(): Observable<number> {
  return this.http.get<number>(
    `${environment.apiUrl}/api/branches/me/agency-id`
  );
}

}
