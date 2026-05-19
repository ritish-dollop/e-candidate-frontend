import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Note } from '../../../../customer-portal/models/Note.model';
import { NoteService } from '../../../../customer-portal/services/note.service';
import { ActivatedRoute } from '@angular/router';
import { CompanyuserService } from '../../../../customer-portal/services/companyuser.service';
import { CustomerRolePipe } from '../../../../customer-portal/Pipe/customer-role.pipe';
import { NotificationSocketService } from '../../../../socket-services/notificationSocket.service';

@Component({
  selector: 'app-notes',
  imports: [CommonModule,CustomerRolePipe],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent implements OnInit {


  notes: Note[] = [];
  newNote: string = '';
  createdById!: number;
  customerId!: number;

  roles: string[] = [];
  page = 0;
  size = 4;
  totalPages = 0;

  constructor(private noteService: NoteService, private route: ActivatedRoute, private companyuserService: CompanyuserService,private notificationSocket: NotificationSocketService) { }

  ngOnInit(): void {

  this.route.paramMap.subscribe(params => {
    const id = params.get('customerId');
    this.customerId = Number(id);

    if (!this.customerId) {
      console.warn('❌ customerId missing');
      return;
    }

    const agencyUserId = Number(localStorage.getItem('userId'));
    if (agencyUserId) {
      this.notificationSocket.connect('AGENCY_USER', agencyUserId);
    }

    this.notificationSocket.notification$.subscribe(notification => {
      console.log('🔔 Notes notification received:', notification);

      if (
        notification?.type === 'NOTE_ASSIGNED' &&
        notification?.entityType === 'NOTE'
      ) {
        console.log('🆕 Reloading notes instantly');
        this.page = 0;
        this.loadNotes(); 
      }
    });

    this.loadNotes();
  });
}

  loadNotes() {
    this.noteService.getNotesByCustomer(this.customerId, this.page, this.size).subscribe({
      next: (res) => {
        this.notes = res.content;
        this.totalPages = res.totalPages;
        console.log(res);
      },
      error: (err) => console.error("Error loading notes:", err)
    });
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadNotes();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadNotes();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.page = page;
      this.loadNotes();
    }
  }

}
