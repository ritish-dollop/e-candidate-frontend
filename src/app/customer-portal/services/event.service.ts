import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AllEvents } from '../models/AllEvents.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private baseUrl = `${environment.apiUrl}/api/events`;
  constructor(private http: HttpClient) { }

  getAllEvents(): Observable<AllEvents[]> {
    return this.http.get<AllEvents[]>(`${this.baseUrl}/getall`);
  }

  getEventsByAgency(agencyId: number): Observable<AllEvents[]> {
    return this.http.get<AllEvents[]>(`${this.baseUrl}/agency/${agencyId}`);
  }

  createEvent(event: AllEvents): Observable<AllEvents> {
    return this.http.post<AllEvents>(`${this.baseUrl}/create`, event);
  }

  deleteEvent(eventId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/delete/${eventId}`, { responseType: 'text' as 'text' });
  }

  changeEventStatus(eventId: number, status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'): Observable<any> {
    return this.http.patch<AllEvents>(
      `${this.baseUrl}/change/${eventId}/status?status=${status}`,
      {}
    );
  }
  
  getEventById(eventId: number): Observable<AllEvents> {
    return this.http.get<AllEvents>(`${this.baseUrl}/get/${eventId}`);
  }

  updateEvent(eventId: number, body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${eventId}`, body);
  }

  getEventsCreatedByUser(userId: number): Observable<AllEvents[]> {
    return this.http.get<AllEvents[]>(
      `${this.baseUrl}/created-by-user/${userId}`
    );
  }

  getEventsCreatedByCustomerUser(customerUserId: number): Observable<AllEvents[]> {
    return this.http.get<AllEvents[]>(
      `${this.baseUrl}/created-by-customer/${customerUserId}`
    );
  }

  getEventsByAssignee(assigneeId: number): Observable<AllEvents[]> {
    return this.http.get<AllEvents[]>(
      `${this.baseUrl}/assignee/${assigneeId}`
    );
  }

getEventsAssignedToBranchUser(branchUserId: number): Observable<AllEvents[]> {
  return this.http.get<AllEvents[]>(
    `${this.baseUrl}/assigned/branch/${branchUserId}`
  );
}

getEventsCreatedByBranchUser(branchUserId: number): Observable<AllEvents[]> {
  return this.http.get<AllEvents[]>(
    `${this.baseUrl}/created/branch/${branchUserId}`
  );
}
getEventsByCustomerUser(customerUserId: number): Observable<AllEvents[]> {
  return this.http.get<AllEvents[]>(
    `${this.baseUrl}/customer-user/${customerUserId}`
  );
}

}