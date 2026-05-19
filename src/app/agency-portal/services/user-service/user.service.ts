import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatUserResponseDto, UserRequest, UserResponse } from '../../interfaces/user-request';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api/user';
  // private header = new HttpHeaders().set('content-type', 'application/json');
  constructor(private http: HttpClient) { }

  searchEmails(keyword: string) {
    return this.http.get<string[]>(
      `http://localhost:8080/api/chat/user/search-emails`,
      { params: { keyword } }
    );
  }
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/all`);
  }

  getUserById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  getUsersByAgency(agencyId: number): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/agency/${agencyId}`);
  }

  createUser(user: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/create`, user);
  }

  updateUser(id: number, user: UserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.baseUrl}/update/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  changeUserStatus(id: number, status: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${this.baseUrl}/${id}/status?status=${status}`, {}
    );
  }
  searchUsers(keyword: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.baseUrl}/search?keyword=${keyword}`);
  }
  getUsersForNewChat(userId: number): Observable<any> {
    console.log(userId);

    return this.http.get<any>(`http://localhost:8080/api/chat/user/for-chat/${userId}`);
  }
  getUsersForNewChatForRoom(userId: number): Observable<ChatUserResponseDto[]> {
    console.log(userId);

    return this.http.get<ChatUserResponseDto[]>(`http://localhost:8080/api/chat/user/for-chat/room/${userId}`);
  }
}