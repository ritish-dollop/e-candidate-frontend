import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BranchUser } from '../models/BranchUser.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BranchUserService {
  private baseUrl = 'http://localhost:8080/api/branch-users';

  constructor(private http: HttpClient) {}

  getUsersByBranch(branchId: number, page: number, size: number) {
    return this.http.get<any>(
      `${this.baseUrl}/branch/${branchId}?page=${page}&size=${size}`
    );
  }

  addUser(branchId: number, user: any, file?: File) {
    const formData = new FormData();

    formData.append(
      'user',
      new Blob([JSON.stringify({ ...user, branchId })], {
        type: 'application/json',
      })
    );

    if (file) {
      formData.append('file', file);
    }

    return this.http.post(`${this.baseUrl}`, formData);
  }
  updateUser(id: number, user: any, file?: File) {
    const formData = new FormData();

    formData.append(
      'user',
      new Blob([JSON.stringify(user)], {
        type: 'application/json',
      })
    );

    if (file) {
      formData.append('file', file);
    }

    return this.http.put(`${this.baseUrl}/${id}`, formData);
  }

  /** Toggle status */
  toggleStatus(id: number, newStatus: string): Observable<BranchUser> {
    return this.http.put<BranchUser>(
      `${this.baseUrl}/${id}/status/${newStatus}`,
      {}
    );
  }

  /** Delete user */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      responseType: 'text' as 'json',
    });
  }
  getBranchDetails(branchId: number) {
    return this.http.get(`http://localhost:8080/api/branches/${branchId}`);
  }
  resetPassword(userId: number, newPassword: string) {
    return this.http.put(`${this.baseUrl}/${userId}/reset-password`,{ password: newPassword },
      { responseType: 'text' as 'text' }
    );
  }
}
