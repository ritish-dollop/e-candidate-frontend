import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerUser } from '../models/CustomerUser.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerUserService {

  private baseUrl = `${environment.apiUrl}/api/customer-users`;
  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<CustomerUser[]> {
    return this.http.get<CustomerUser[]>(`${this.baseUrl}/all-without-pagination`);
  }
}
