import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { AgencyService } from '../../../services/agency-service/services.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AgencyResponseDto } from '../../../interfaces/agency';
import { UserService } from '../../../services/user-service/user.service';
import { UserRequest, UserResponse } from '../../../interfaces/user-request';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import * as bootstrap from 'bootstrap';
import { AuthService } from '../../../../auth/services/auth.service';

@Component({
  selector: 'app-agency-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agency-details.component.html',
  styleUrl: './agency-details.component.css',
})
export class AgencyDetailsComponent {
  isEditMode = false;
  resetPassword = false;

  profilePreview: string | ArrayBuffer | null = null;
  agencies: any[] = [];
  currentUser: any;

  newUser: UserRequest = {
    name: '',
    email: '',
    phone: '',
    password: '',
    agencyId: 0,
    role: '',
    status: 'ACTIVE',
    profilePicture: '',
  };

  errors: any = {};

  logoUrl: string | ArrayBuffer | null = null;
  agencyId: number = 0;
  agency!: AgencyResponseDto;
  users: UserResponse[] = [];
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = 0;

  constructor(
    private route: ActivatedRoute,
    private agencyService: AgencyService,
    private userService: UserService,
    private router : Router,
    private auth : AuthService
  ) {}
    ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
  this.loadUser(id);
  }
  loadUser(id : number) {
    this.auth.getCurrentUser().subscribe({
      next: (res: UserResponse) => {
        console.log(res);
        this.currentUser = res;
  this.loadAgency(id);
    this.loadUsers(id, this.currentPage, this.pageSize);
      },
      error: (err) => {

        if (err.status === 401) {
          // this.error = "Session expired. Please login again.";
          console.log('Session expired. Please login again.');
        } else {
          console.log('Unable to load profile.');
        }
        console.log(err);
        this.router.navigate(['/auth/login']);
        this.currentUser = null;
      },
    });
  }
  clearError(field: string) {
    this.errors[field] = '';
  }



  loadAgency(id: number) {
    this.agencyService.getAgencyById(id).subscribe({
      next: (res) => (this.agency = res),
      error: (err) => console.error('Failed to load agency', err),
    });
  }

  loadUsers(agencyId: number, page: number, size: number) {
    this.agencyService.getAgencyUsers(agencyId, page, size).subscribe({
      next: (res: any) => {
        this.users = res.content;
        this.currentPage = res.number;
        this.totalPages = res.totalPages;
      },
      error: (err) => console.error('Failed to load users', err),
    });
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    const agencyId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUsers(agencyId, page, this.pageSize);
  }
  selectedFile: File | null = null;
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      if (!this.selectedFile.type.startsWith('image/')) {
        // alert('Please select a valid image file (JPG, PNG)');
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File',
          text: 'Please select a valid image file (JPG, PNG).',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview = reader.result;

        if (this.profilePreview) {
          this.newUser.profilePicture = this.profilePreview.toString();
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  createUser() {
    if (!this.agency) return;

    this.errors = {};
    this.newUser.agencyId = this.agency.id;

    if (!this.newUser.name) this.errors.name = 'Name is required';
    if (!this.newUser.email) this.errors.email = 'Email is required';
    if (!this.newUser.phone) this.errors.phone = 'Phone is required';
    if (!this.newUser.role) this.errors.role = 'Role is required';
    if (!this.newUser.password) this.errors.password = 'Password is required';

    if (Object.keys(this.errors).length) return;

    this.userService.createUser(this.newUser).subscribe({
   next: () => {
  Swal.fire('Success', 'User created successfully!', 'success');

  this.loadUsers(this.agency.id, this.currentPage, this.pageSize);

 this.closeModal();   // 👈 IMPORTANT
},

      error: (err: HttpErrorResponse) => {
        Swal.fire(
          'Failed',
          err.error?.message || 'Something went wrong',
          'error'
        );
      },
    });
  }
    toggleStatus(user: UserResponse): void {
      const newStatus = user.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';

      this.userService.changeUserStatus(user.id, newStatus).subscribe({
        next: (updated) => {
          user.status = updated.status;
          Swal.fire({
            icon: 'success',
            title: 'Status Updated',
            text: `User status changed to ${updated.status}`,
            timer: 1500,
            showConfirmButton: false,
          });
          // alert('Status Updated Successfully');
        },
        error: () => {
          // alert('Failed to update status');
          // console.log();

          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to update status.',
          });
        },
      });
    }
resetForm() {
  this.newUser = {
    name: '',
    email: '',
    phone: '',
    password: '',
    agencyId: 0,
    role: '',
    status: 'ACTIVE',
    profilePicture: '',
  };

  this.profilePreview = null;
  this.errors = {};
}
closeModal() {
  const modalEl = document.getElementById('addUserModal');

  if (!modalEl) return;

  // Hide modal
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
  modalEl.setAttribute('aria-hidden', 'true');

  // Remove backdrop
  const backdrops = document.getElementsByClassName('modal-backdrop');
  while (backdrops.length > 0) {
    backdrops[0].parentNode?.removeChild(backdrops[0]);
  }

  // Restore body scroll
  document.body.classList.remove('modal-open');
  document.body.style.overflow = 'auto';

  this.resetForm();
}
  isAdmin(): boolean {
    return (
      this.currentUser?.role === 'AGENCY_SUPER_ADMIN' ||
      this.currentUser?.role === 'AGENCY_ADMIN'
    );
  }
  // onFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files[0]) {
  //     const file = input.files[0];
  //     const reader = new FileReader();
  //     reader.onload = () => {
  //       this.logoUrl = reader.result;
  //     };
  //     reader.readAsDataURL(file);
  //   }

  // }
}
