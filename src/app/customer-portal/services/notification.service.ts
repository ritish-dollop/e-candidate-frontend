import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private baseUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(type: string, id: number) {
    return this.http.get<any[]>(
      `${this.baseUrl}/get?recipientType=${type}&recipientId=${id}`
    );
  }
  clearAll(type: string, id: number) {
  return this.http.delete(
    `${this.baseUrl}/clear?recipientType=${type}&recipientId=${id}`
  );
}
getUnreadCount(type: string, id: number) {
  return this.http.get<number>(
    `${this.baseUrl}/unread-count?recipientType=${type}&recipientId=${id}`
  );
}
}
