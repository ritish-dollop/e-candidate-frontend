import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MailDTO, MailResponseDTO, UserMailDTO } from '../../interfaces/email';

@Injectable({ providedIn: 'root' })

export class MailService {
  private baseUrl = 'http://localhost:8080/api/mails'; // adapt if needed

  constructor(private http: HttpClient) {}

  getInbox(userId: number): Observable<MailResponseDTO[]> {
    return this.http.get<MailResponseDTO[]>(`${this.baseUrl}/inbox/${userId}`);
  }

  getSent(userId: number): Observable<MailResponseDTO[]> {
    return this.http.get<MailResponseDTO[]>(`${this.baseUrl}/sent/${userId}`);
  }

  getStarred(userId: number): Observable<MailResponseDTO[]> {
    return this.http.get<MailResponseDTO[]>(`${this.baseUrl}/starred/${userId}`);
  }

  getMail(mailId: number, userId: number) :Observable<MailResponseDTO> {
    return this.http.get<MailResponseDTO>(`${this.baseUrl}/${mailId}/user/${userId}`);
  }

  sendMail(payload: any) {
    return this.http.post(`${this.baseUrl}/send`, payload);
  }

  markAsRead(mailId: number, userId: number) {
    return this.http.put(`${this.baseUrl}/${mailId}/read/${userId}`, {});
  }

  toggleStar(mailId: number, userId: number) {
    return this.http.put(`${this.baseUrl}/${mailId}/star/${userId}`, {});
  }

  moveToTrash(mailId: number, userId: number) {
    return this.http.put(`${this.baseUrl}/${mailId}/trash/${userId}`, {});
  }
}
