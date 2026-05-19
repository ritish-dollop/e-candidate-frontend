import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Branch } from '../models/Branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {

  private baseUrl = 'http://localhost:8080/api/branches';

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
    'http://localhost:8080/api/branches/me/agency-id'
  );
}

}
