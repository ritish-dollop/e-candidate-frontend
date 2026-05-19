import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CustomerUserResponse } from '../models/CustomerUser.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyuserService {

  private baseUrl = `${environment.apiUrl}/api/customer-users`;

  constructor(private http: HttpClient) { }
  getAllUsers(page: number, size: number) {
    return this.http.get<any>(
      `${environment.apiUrl}/api/customer-users?page=${page}&size=${size}`
    );
  }

  getUsersByCustomerWithPagination(
    customerId: number,
    page: number = 0,
    size: number = 10
  ): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/customer/${customerId}?page=${page}&size=${size}`
    );
  }

  createUser(formData: FormData): Observable<CustomerUserResponse> {
    return this.http.post<CustomerUserResponse>(this.baseUrl, formData);
  }

  updateStatus(
    userId: number,
    status: string
  ): Observable<CustomerUserResponse> {
    return this.http.put<CustomerUserResponse>(
      `${this.baseUrl}/${userId}/status?status=${status}`,
      {}
    );
  }

  resetPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${userId}/reset-password?newPassword=${newPassword}`,
      {}
    );
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${userId}`, { responseType: 'text' as 'json' });
  }
  updateUser(id: number, data: FormData): Observable<CustomerUserResponse> {
    return this.http.put<CustomerUserResponse>(`${this.baseUrl}/${id}`, data);
  }

  getAgencyIdOfLoggedInCustomerUser(): Observable<number> {
    const token = localStorage.getItem('jwtToken');

    return this.http.get<number>(
      `${environment.apiUrl}/api/customer/me/agency-id`,
      {
        headers: {
          Authorization: 'Bearer ' + token
        }
      }
    );
  }
}
