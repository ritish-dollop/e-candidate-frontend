import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerResponse } from '../../interfaces/customer';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private baseUrl = `${environment.apiUrl}/api/customer`;
  constructor(private http: HttpClient) { }
  getAll(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(this.baseUrl);
  }

  getByAgency(id: number): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(`${this.baseUrl}/agency/${id}`);
  }

getAllPaginated(page: number, size: number): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/paginated?page=${page}&size=${size}`
  );
}

getByAgencyPaginated(agencyId: number, page: number, size: number): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/paginated/agency/${agencyId}?page=${page}&size=${size}`
  );
}

  create(formData: any): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(`${this.baseUrl}/create`, formData);
  }

  update(id: number, formData: FormData): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.baseUrl}/${id}`, formData);
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
  toggleCustomerStatus(customerId: number) {
  return this.http.put<CustomerResponse>(
    `${this.baseUrl}/${customerId}/toggle-status`,
    null
  );
}
}