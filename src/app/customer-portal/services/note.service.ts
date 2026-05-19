import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Note } from '../models/Note.model';
import { environment } from '../../../environments/environment';

interface NoteRequestDto {
  leadId: number;
  createdById: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {

  private baseUrl = `${environment.apiUrl}/api/notes`;

  constructor(private http: HttpClient) { }

  createNote(note: NoteRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}`, note);
  }

  getNoteById(noteId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${noteId}`);
  }

  getNotesByLead(leadId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/lead/${leadId}`);
  }

  getNotesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`);
  }

  deleteNote(noteId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${noteId}`, { responseType: 'text' });
  }
  getNotesByAgency(agencyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/agency/${agencyId}`);
  }
  createNoteForAgency(note: any): Observable<Note> {
    return this.http.post<Note>(`${this.baseUrl}`, note);
  }

  getMyNotes(page: number, size: number){
    return this.http.get<any>(`${this.baseUrl}/my-notes?page=${page}&size=${size}`);
  }

  getNotesByCustomer(customerId: number,page: number = 0, size: number = 5): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/customer/${customerId}?page=${page}&size=${size}`);
  }
}
