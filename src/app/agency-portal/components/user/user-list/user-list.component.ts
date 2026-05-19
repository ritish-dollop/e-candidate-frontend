import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import {
  ChatUserResponseDto,
  UserRequest,
  UserResponse,
} from '../../../interfaces/user-request';
import { AgencyService } from '../../../services/agency-service/services.service';
import { UserService } from '../../../services/user-service/user.service';
import { AuthService } from '../../../../auth/services/auth.service';
import {
  AgencyRequestDto,
  AgencyResponseDto,
} from '../../../interfaces/agency';
import { InputTextFieldComponent } from '../../../../reusable-components/input-text-field/input-text-field.component';
import * as bootstrap from 'bootstrap';
import { CustomerRolePipe } from '../../../../customer-portal/Pipe/customer-role.pipe';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,CustomerRolePipe],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit {
  agencies: AgencyResponseDto[] = [];
  users: UserResponse[] = [];
  loading = false;
  isEditMode = false;
  editUserId: number | null = null;
  selectedUser: UserResponse | null = null;
  currentUser: UserResponse | null = null;
  selectedFile: File | null = null;
  profilePreview: string | ArrayBuffer | null = null;

  currentPage = 1;
  usersPerPage = 5;

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
  constructor(
    private userService: UserService,
    private router: Router,
    private agencyService: AgencyService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.auth.getCurrentUser().subscribe({
      next: (data) => {
        this.currentUser = data;
        console.log(data);

        this.loadUsers();
        this.loadAgencies();
      },
      error: (err) => {
        console.log(err);
        this.router.navigate(['/auth']);
      },
    });
  }

loadUsers(): void {
  this.loading = true;

  const onSuccess = (data: UserResponse[]) => {
    // ✅ filter AFTER data arrives
    this.users = data.filter(
      user => user.id !== this.currentUser?.id
    );
    this.loading = false;
  };

  const onError = (err: HttpErrorResponse) => {
    console.error('Failed to load users:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error loading data',
      text: 'Unable to load users.',
    });
    this.loading = false;
  };

  if (this.currentUser?.role === 'AGENCY_SUPER_ADMIN') {
    this.userService.getAllUsers().subscribe({
      next: onSuccess,
      error: onError,
    });
  } else {
    if (!this.currentUser?.agencyId) {
      this.loading = false;
      return;
    }

    this.userService.getUsersByAgency(this.currentUser.agencyId).subscribe({
      next: onSuccess,
      error: onError,
    });
  }
}
resetPassword: boolean = false;

toggleResetPassword() {
  this.resetPassword = !this.resetPassword;

  if (!this.resetPassword) {
    this.newUser.password = '';
    delete this.errors.password;
  }
}

  loadAgencies(): void {
    this.agencyService.getAllAgencies().subscribe({
      next: (res) => (this.agencies = res),
      error: (err) => console.error('Failed to load agencies', err),
    });
  }

  onEditUser(user: UserResponse): void {
    this.isEditMode = true;
    this.editUserId = user.id;
    this.newUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password, // password not shown
      agencyId: user.agencyId ? user.agencyId : 0,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture || '',
    };

    this.profilePreview = user.profilePicture ?? null;
    this.selectedFile = null;
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.usersPerPage);
  }
  viewProfile(user: UserResponse) {
    this.selectedUser = { ...user };

    const modalEl = document.getElementById('fullProfileModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl, {
      backdrop: true,
      keyboard: true,
    });

    modal.show();
  }

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

  validateForm(): boolean {
    let valid = true;

    this.errors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      agency: '',
    };

    if (!this.newUser.name?.trim()) {
      this.errors.name = 'User Name is required';
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.newUser.email || !emailPattern.test(this.newUser.email)) {
      this.errors.email = 'Valid email is required';
      valid = false;
    }

    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!this.newUser.phone || !phonePattern.test(this.newUser.phone)) {
      this.errors.phone = 'Valid contact number required';
      valid = false;
    }

    if (
      !this.isEditMode &&
      (!this.newUser.password || this.newUser.password.length < 6)
    ) {
      this.errors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!this.newUser.role) {
      this.errors.role = 'User role is required';
      valid = false;
    }

    if (this.newUser.agencyId <= 0) {
      this.errors.agency = 'Agency is required';
      valid = false;
    }
    console.log(this.newUser);
    console.log(valid);

    return valid;
  }

  createUser() {
    console.log('123456789098765432');
    if (!this.currentUser?.id) {
      return;
    }
    console.log(this.newUser);
    if (!this.validateForm()) {
      return; // Stop submission when validation fails
    }

    console.log(this.newUser);

    const apiCall = this.isEditMode
      ? this.userService.updateUser(this.editUserId!, this.newUser)
      : this.userService.createUser(this.newUser);

    apiCall.subscribe({
      next: () => {
        Swal.fire(
          'Success',
          `User ${this.isEditMode ? 'updated' : 'created'} successfully!`,
          'success'
        );
        this.closeModal();
        this.resetUserForm();
        this.loadUsers();
      },
      error: (err: HttpErrorResponse) => {
        const backendMessage = err.error?.message || 'Something went wrong';
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: backendMessage,
        });
      },
    });
  }

  closeFullProfile() {
    const modalEl = document.getElementById('fullProfileModal');
    if (!modalEl) return;

    const modalInstance =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

    modalInstance.hide();
  }

  openEditFromProfile() {
    if (!this.selectedUser) return;

    // 1️⃣ Load data
    this.onEditUser(this.selectedUser);

    // 2️⃣ Close VIEW modal properly
    const viewEl = document.getElementById('fullProfileModal');
    if (viewEl) {
      const viewModal =
        bootstrap.Modal.getInstance(viewEl) || new bootstrap.Modal(viewEl);

      viewModal.hide();
    }

    // 3️⃣ Open EDIT modal after small delay
    setTimeout(() => {
      const editEl = document.getElementById('addUserModal');
      if (!editEl) return;

      const editModal = new bootstrap.Modal(editEl, {
        backdrop: 'static',
        keyboard: false,
      });

      editModal.show();
    }, 300);
  }

  closeModal() {
    const modalEl = document.getElementById('addUserModal');
    if (!modalEl) return;

    const modal =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);

    modal.hide();
  }

  goToPage(page: number): void {
    if (page < 1 || page > Math.ceil(this.users.length / this.usersPerPage))
      return;
    this.currentPage = page;
  }
  get paginatedAgencies(): UserResponse[] {
    const start = (this.currentPage - 1) * this.usersPerPage;
    return this.users.slice(start, start + this.usersPerPage);
  }

  deleteUser(id: number | undefined): void {
    if (!id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(id).subscribe({
          next: () => {
            this.users = this.users.filter((u) => u.id !== id);
            this.closeFullProfile();
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'User deleted successfully.',
            });
            this.loadUsers();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: 'Failed to delete user.',
            });
          },
        });
      }
    });
  }

  clearError(field: string) {
    this.errors[field] = '';
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

  get paginatedUsers(): UserResponse[] {
    const start = (this.currentPage - 1) * this.usersPerPage;
    return this.users.slice(start, start + this.usersPerPage);
  }

  resetUserForm(): void {
    if (this.currentUser?.role == 'AGENCY_SUPER_ADMIN') {
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
    } else if (this.currentUser && this.currentUser?.agencyId) {
      this.newUser = {
        name: '',
        email: '',
        phone: '',
        password: '',
        agencyId: this.currentUser.agencyId,
        role: '',
        status: 'ACTIVE',
        profilePicture: '',
      };
    } else {
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
    }
    this.errors = {};
    this.profilePreview = null;
    this.selectedFile = null;
    this.isEditMode = false;
    this.editUserId = null;
  }
  isAdmin(): boolean {
    return (
      this.currentUser?.role === 'AGENCY_SUPER_ADMIN' ||
      this.currentUser?.role === 'AGENCY_ADMIN'
    );
  }

  trackById(_: number, item: UserResponse) {
    return item.id;
  }
}
