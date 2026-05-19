import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import io, { Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService {

  private socket!: SocketIOClient.Socket;
  private readonly SOCKET_URL = environment.socketUrl;

  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();

  connect(recipientType: string, recipientId: number): void {

    if (!recipientId || recipientId <= 0) {
    console.error(' INVALID SOCKET ID', recipientType, recipientId);
    return;
  }
    const userKey = `${recipientType}:${recipientId}`;
    if (this.socket) {
    console.warn('♻️ Closing previous socket before reconnect');
    this.socket.disconnect();
    this.socket = undefined as any;
  }

    if (this.socket?.connected) {
      console.log(' Notification socket already connected:', this.socket.id);
      return;
    }

    console.log(' Connecting notification socket with key:', userKey);

    this.socket = io(this.SOCKET_URL, {
      transports: ['websocket'],
      query: { user: userKey }
    });

    this.socket.on('connect', () => {
      console.log(' Notification socket connected:', this.socket.id);
      
    });

    this.socket.on('disconnect', () => {
      console.log(' Notification socket disconnected');
    });

    this.socket.on('receive_notification', (data: any) => {
      console.log(' Notification received:', data);
      this.notificationSubject.next(data);
    });
  }
  emit(event: string, payload: any): void {
    
    if (!this.socket) {
      console.warn(' Notification socket not connected');
      return;
    }
    this.socket.emit(event, payload);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log(' Notification socket disconnected manually');
    }
  }
}
