import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import { ChatMessageResponse, ChatRoomResponse } from '../../components/chat/chat-list/chat-list.component';
import { AuthService } from '../../../auth/services/auth.service';
import { ChatUserResponseDto } from '../../interfaces/user-request';


@Injectable({
  providedIn: 'root'
})
export class ChatServicesService {

  private baseUrl = 'http://localhost:8080/api';

  private header = new HttpHeaders().set('content-type', 'application/json');

  constructor(private http: HttpClient , private auth : AuthService) {
  }


updateGroupPhoto(chatId: number, url: string): Observable<ChatRoomResponse> {
  return this.http.patch<ChatRoomResponse>(
    `${this.baseUrl}/chatrooms/update-photo/${chatId}?url=${encodeURIComponent(url)}`,
    {}
  );
}




editMessage(msgId: number, newText: string):Observable<ChatMessageResponse[]> {
  return this.http.patch<ChatMessageResponse[]>(`${this.baseUrl}/messages/edit/${msgId}`,  null,
    { params: { newText } });
}

deleteMessage(msgId: number) :Observable<ChatMessageResponse[]>{
        const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  return this.http.delete<ChatMessageResponse[]>(`${this.baseUrl}/messages/delete/${msgId}`,{headers});
}

// sendMessage(req: any) {
//   return this.http.post("/api/messages/send", req);
// }

// getMessages(chatId: string) {
//   return this.http.get<any[]>(`/api/messages/chat/${chatId}`);
// }



  sendMessage(payload: any) {
      const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  console.log(this.auth.getToken());

    return this.http.post(`${this.baseUrl}/messages/send`, payload, { headers});
  }

  // ---------------- GET OLD MESSAGES ----------------
  getMessages(roomId: number) {
      const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  console.log(this.auth.getToken());

    return this.http.get<any[]>(`${this.baseUrl}/messages/chatroom/${roomId}`, { headers });
  }


  getChatRoomsById(roomId: number) {
      const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  console.log(this.auth.getToken());

  return this.http.get<ChatRoomResponse>(`${this.baseUrl}/chatrooms/${roomId}`, { headers });
}
 getChatRoomByUser(userId: number, isRoom: boolean) {

  const headers = new HttpHeaders({
    Authorization: 'Bearer ' + this.auth.getToken()
  });

  const params = new HttpParams()
    .set('isRoom', isRoom.toString());

  return this.http.get<ChatRoomResponse[]>(
    `${this.baseUrl}/chatrooms/user/${userId}`,
    { headers, params }
  );
}

//   getAllChatRooms(type: string) {
//   return this.http.get<any[]>(`${this.baseUrl}/chatrooms`, { headers: this.header });
// }

createChatRoom(payload: any) :Observable<ChatRoomResponse>{
   const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  console.log(this.auth.getToken());

  return this.http.post<ChatRoomResponse>(`${this.baseUrl}/chatrooms/create`, payload, { headers });
}


sendChatMessage(formData: FormData): Observable<any> {

    const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  console.log(this.auth.getToken());

  return this.http.post(`${this.baseUrl}/messages/send`, formData ,{headers});
}
// Check if chat already exists
checkChatRoom(user1: number, user2: number) {
   const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  return this.http.get<{ exists: boolean, roomId: number }>( `${this.baseUrl}/chatrooms/check-room?user1=${user1}&user2=${user2}`,{headers});
}
addMembersToGroup(chatRoomId: number, userIds: number[]):Observable<ChatRoomResponse> {
    const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + this.auth.getToken()
  });
  return this.http.post<ChatRoomResponse>(
    `${this.baseUrl}/chatrooms/add-members/${chatRoomId}`,
    userIds,
    { headers}
  );
}

getCurrentUser(): Observable<ChatUserResponseDto> {
  // console.log(this.getToken());
  return this.http.get<ChatUserResponseDto>(`http://localhost:8080/api/chat/user/me`);
}

}
