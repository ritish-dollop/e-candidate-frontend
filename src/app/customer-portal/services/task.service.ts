import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Task } from '../models/Task.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private baseUrl = `${environment.apiUrl}/api/tasks`;
  constructor(private http: HttpClient) { }

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}`);
  }

  addTask(task: any): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}`, task);
  }

  getTaskById(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${taskId}`);
  }

  updateTask(taskId: number, task: any): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${taskId}`, task);
  }

  deleteTask(taskId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${taskId}`, {
      responseType: 'text'
    });
  }

  //  AGENCY SIDE
  getTasksByAgency(agencyId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/agency/${agencyId}`
    );
  }

  getTasksByAgencyUser(userId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/agency-user/${userId}`
    );
  }

  //  CUSTOMER SIDE
  // CUSTOMER TEAM MEMBER – ONLY ASSIGNED TASKS
  getTasksByCustomerUser(customerUserId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/customer-user/${customerUserId}`
    );
  }

  //  CREATED BY LOGGED-IN USER
  //  CREATED BY LOGGED-IN USER (ROLE BASED)
  getMyCreatedTasks(): Observable<Task[]> {
    const role = localStorage.getItem('role');
    if (role === 'CUSTOMER_TEAM_MEMBER' || role === 'CUSTOMER_ADMIN') {
      const customerUserId = Number(localStorage.getItem('customerUserId'));
      return this.http.get<Task[]>(
        `${this.baseUrl}/created-by/customer/${customerUserId}`
      );
    }

    const userId = Number(localStorage.getItem('userId'));
    return this.http.get<Task[]>(
      `${this.baseUrl}/created-by/user/${userId}`
    );
  }

  getTasksCreatedByCustomer(customerUserId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/created-by/customer/${customerUserId}`
    );
  }

  getTasksCreatedByAgencyUser(userId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/created-by/user/${userId}`
    );
  }

  getTasksByAssignedBranchUser(branchUserId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/assigned/branch/${branchUserId}`
    );
  }

  getTasksCreatedByBranchUser(branchUserId: number): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.baseUrl}/created/branch/${branchUserId}`
    );
  }

  getBranchCreatedAgencyTasks(agencyId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.baseUrl}/agency/${agencyId}/branch-created-only`);
  }

  getTasksByCustomer(customerId: number, page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/customer/${customerId}?page=${page}&size=${size}`);
  }

}
