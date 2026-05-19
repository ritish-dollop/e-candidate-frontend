import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import io, { Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class SocketService {

    private abcCallSource = new Subject<void>();
  abcCall$ = this.abcCallSource.asObservable();

  callAbc() {
    this.abcCallSource.next();
  }

    private updateLeadSubject = new Subject<any>();

  updateLead$ = this.updateLeadSubject.asObservable();
  

  private socket!: SocketIOClient.Socket;
  private readonly SOCKET_URL = environment.socketUrl;
  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();
  isConnected: boolean = false;
  connect(userId : string) {
    if (this.socket && this.socket.connected) {
      console.log('Already connected:', this.socket.id);
      return;
    } else {
      console.log('socket not connected!! '+userId);
        this.socket = io(this.SOCKET_URL, {
      transports: ['websocket'],
      query: { user: userId }
    });
    }

    // this.socket = io(`${this.SOCKET_URL}?user=${userId}`, {
    //   transports: ['websocket'],
    // });

    this.socket.on('connect', () => {
       this.isConnected = true;
      console.log('🟢 Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected' , this.socket.id);
    });

    // this.socket.on('recieve_chat', (data: any) => {
      // alert(data);
    // });
    // 🔔 Notification event
    // this.socket.on('receive_notification', (data: any) => {
    //   console.log('Notification received:', data);
    //   this.notificationSubject.next(data);
    // });
  }

  once(event: string, callback: (...args: any[]) => void) {
    this.socket.once(event, callback); // NOW VALID
  }

  off(event: string) {
    this.socket.off(event);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  emit(event: string, data: any) {
    console.log(data);
    if (!this.socket) {
      console.log('============');

      return};
    this.socket.emit(event, data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
          this.isConnected = false;
      console.log('❌ Manually disconnected');
    }
  }
}
