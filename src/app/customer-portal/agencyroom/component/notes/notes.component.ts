import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NoteService } from '../../../services/note.service';
import { Note } from '../../../models/Note.model';
import { AuthService } from '../../../../auth/services/auth.service';
import { CompanyuserService } from '../../../services/companyuser.service';
import Swal from 'sweetalert2';
import { CustomerRolePipe } from '../../../Pipe/customer-role.pipe';


@Component({
  selector: 'app-notes',
  imports: [FormsModule, CommonModule,CustomerRolePipe],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent implements OnInit {

  notes: Note[] = [];
  newNote: string = '';
  createdById!: number;
  agencyId!: number;

  roles: string[] = [];
   page = 0;
  size = 4;
  totalPages = 0;

  constructor(private noteService: NoteService, private authService: AuthService, private companyuserService: CompanyuserService) { }

  ngOnInit(): void {
    this.roles = this.authService.getUserRoles();
    this.loadNotes();
  }

  // ⭐ Customer Admin OR Branch Admin have full access
  isBranchAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isBranchTeamMember(): boolean {
    return this.roles.includes('BRANCH_TEAM_MEMBER') || this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }

  loadNotes() {
    this.noteService.getMyNotes(this.page, this.size).subscribe({
      next: (res) => {
        this.notes = res.content;       // ✅ actual list
      this.totalPages = res.totalPages;
        console.log(res);
      },
      error: (err) => console.error("Error loading notes:", err)
    });
  }

  addNote() {
    if (!this.newNote.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Note',
        text: 'Please enter note content!'
      });
      return;
    }

    const req = {
      content: this.newNote.trim(),
      // agencyId: this.agencyId,
      // createdById: this.createdById
    }

    this.noteService.createNoteForAgency(req).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Note Added',
          text: 'Note created successfully!',
          timer: 1200,
          showConfirmButton: false
        });
        this.newNote = '';
        this.loadNotes();
      },
      error: (err) => {
        console.error('Error creating note:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to create note!'
        });
      }

    });
  }

  deleteNote(noteId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This note will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.noteService.deleteNote(noteId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'Note deleted successfully!',
              timer: 1200,
              showConfirmButton: false
            });

            this.loadNotes();
          },
          error: (err) => {
            console.error('Error deleting note:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Failed to delete note!'
            });
          }
        });
      }
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
