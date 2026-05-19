import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CustomerUserResponse } from '../../../models/CustomerUser.model';
import { CompanyuserService } from '../../../services/companyuser.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/services/auth.service';
import Swal from 'sweetalert2';
import { CustomerRolePipe } from '../../../Pipe/customer-role.pipe';


@Component({
  selector: 'app-customer-user',
  imports: [CommonModule, FormsModule, CustomerRolePipe],
  templateUrl: './customer-user.component.html',
  styleUrl: './customer-user.component.css'
})
export class CustomerUserComponent {

  users: CustomerUserResponse[] = [];
  page = 0;
  size = 5;
  totalPages = 0;
  totalElements = 0;

  showUserForm = false;
  isEditMode = false;

  selectedUser: CustomerUserResponse | null = null;

  showResetPopup = false;
  resetPasswordData = {
    userId: null as number | null,
    newPassword: ''
  };

  userData: any = {
    name: '',
    contactNo: '',
    email: '',
    role: '',
    position: '',
    password: ''
  };

  uploadedImageUrl: string | null = null;
  uploadedFile: File | null = null;
  roles: string[] = [];
  constructor(private userService: CompanyuserService, private authService: AuthService) { }

  ngOnInit(): void {
    this.roles = this.authService.getUserRoles();
    const cid = this.authService.getCustomerId();
    if (!cid) {
      console.error('❌ customerId missing from session');
    }

    this.loadAllUsers();
  }
  isCustomerAdmin(): boolean {
    return this.roles.includes('CUSTOMER_ADMIN');
  }

  loadAllUsers() {
    const customerId = Number(localStorage.getItem('customerId'));

    if (!customerId) {
      console.error('❌ customerId not found');
      return;
    }

    this.userService
      .getUsersByCustomerWithPagination(customerId, this.page, this.size)
      .subscribe({
        next: (res: any) => {
          this.users = res.content;
          this.totalPages = res.totalPages;
          this.totalElements = res.totalElements;
        },
        error: (err) => {
          console.error('❌ Failed to load users:', err);
        }
      });
  }

  openAddUser() {
    this.isEditMode = false;
    this.selectedUser = null;

    this.userData = {
      name: '',
      contactNo: '',
      email: '',
      role: '',
      position: '',
      password: ''
    };

    this.uploadedImageUrl = null;
    this.uploadedFile = null;

    this.showUserForm = true;
  }

  openEditUser(user: CustomerUserResponse) {
    this.isEditMode = true;
    this.selectedUser = user;

    this.userData = {
      name: user.name,
      contactNo: user.contactNo,
      email: user.email,
      role: user.role,
      position: user.position,
      password: '' 
    };

    this.uploadedImageUrl = user.profilePicUrl;
    this.uploadedFile = null;

    this.showUserForm = true;
  }

  closeUserForm() {
    this.showUserForm = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.uploadedImageUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  removeUploadedImage(input: HTMLInputElement) {
    this.uploadedImageUrl = null;
    this.uploadedFile = null;
    input.value = '';
  }

  saveUser() {

    if (
      !this.userData.name?.trim() ||
      !this.userData.contactNo?.trim() ||
      !this.userData.email?.trim() ||
      !this.userData.role?.trim() ||
      !this.userData.position?.trim() ||
      (!this.isEditMode && !this.userData.password?.trim())
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all required fields before saving.',
      });
      return;
    }

    const customerId = this.authService.getCustomerId();

    const formData = new FormData();
    formData.append('name', this.userData.name);
    formData.append('contactNo', this.userData.contactNo);
    formData.append('email', this.userData.email);
    formData.append('role', this.userData.role);
    formData.append('position', this.userData.position);
    formData.append('customerId', String(customerId));
    formData.append(
      'status',
      this.isEditMode ? this.selectedUser?.status ?? 'ACTIVE' : 'ACTIVE'
    );

    if (!this.isEditMode) {
      formData.append('password', this.userData.password);
    }

    if (this.uploadedFile) {
      formData.append('profilePic', this.uploadedFile);
    }

    if (this.isEditMode && this.selectedUser) {

      this.userService.updateUser(this.selectedUser.id, formData).subscribe({
        next: (response: CustomerUserResponse) => {

          const userIndex = this.users.findIndex(u => u.id === response.id);
          if (userIndex !== -1) {
            this.users[userIndex] = response;
          } else {
            this.loadAllUsers();
          }

          this.showUserForm = false;

          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'User updated successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('Update failed:', err);

          const errorMessage = this.getErrorMessage(err);

          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: errorMessage,
          });
        }

      });

    }
    else {
      Swal.fire({
                title: 'Creating user...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
              });
              this.showUserForm = false;

      this.userService.createUser(formData).subscribe({
        next: (response: CustomerUserResponse) => {

          this.users = [response, ...this.users];
          this.totalElements++;

          this.showUserForm = false;

          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Added',
            text: 'User added successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('Create failed:', err);

          const errorMessage = this.getErrorMessage(err);

          Swal.fire({
            icon: 'error',
            title: 'Cannot Create User',
            text: errorMessage,
          });
        }

      });
    }
  }


  deleteUser(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This user will be delete and hidden from the list!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const backupUsers = [...this.users];
      this.users = this.users.filter(u => u.id !== id);
      this.totalElements--;

      this.userService.deleteUser(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deactivated',
            text: 'User has been deactivated successfully!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error('Deactivate failed:', err);

          this.users = backupUsers;
          this.totalElements++;

          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to deactivate user. Please try again.',
          });
        }
      });
    });
  }

  resetPassword(user: CustomerUserResponse) {
    this.showResetPopup = true;
    this.resetPasswordData = {
      userId: user.id!,
      newPassword: ''
    };
  }

  submitResetPassword() {
    if (!this.resetPasswordData.userId || !this.resetPasswordData.newPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Input',
        text: 'Password cannot be empty!',
      });
      return;
    }

    this.userService.resetPassword(
      this.resetPasswordData.userId,
      this.resetPasswordData.newPassword
    ).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password reset successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.showResetPopup = false;
      },
      error: (err) => {
        console.error('Reset password error:', err);

        if (err.status === 200 || err.status === 204) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Password reset successfully!',
            timer: 1500,
            showConfirmButton: false,
          });
          this.showResetPopup = false;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to reset password!',
          });
        }
      },
    });
  }


 toggleStatus(user: CustomerUserResponse) {
  if (!this.isCustomerAdmin()) return;

  const newStatus = user.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';
  const oldStatus = user.status; 

  Swal.fire({
    title: 'Are you sure?',
    text:
      newStatus === 'DEACTIVE'
        ? 'This user will be deactivated!'
        : 'This user will be activated!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText:
      newStatus === 'DEACTIVE' ? 'Yes, deactivate!' : 'Yes, activate!',
    cancelButtonText: 'Cancel',
  }).then((result) => {

    if (!result.isConfirmed) {
      return;
    }

    this.userService.updateStatus(user.id, newStatus).subscribe({
      next: () => {
        user.status = newStatus; 

        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: `User ${
            newStatus === 'ACTIVE' ? 'activated' : 'deactivated'
          } successfully!`,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('❌ Status update failed:', err);

        user.status = oldStatus; 

        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to update user status!',
        });
      },
    });
  });
}
onStatusClick(event: MouseEvent, user: CustomerUserResponse) {
  event.preventDefault();   
  event.stopPropagation();

  this.toggleStatus(user);
}




  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadAllUsers();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadAllUsers();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.page = page;
      this.loadAllUsers();
    }
  }

  private getErrorMessage(err: any): string {
    if (err?.error?.message) {
      return err.error.message;
    }

    if (err?.error?.errors) {
      const firstKey = Object.keys(err.error.errors)[0];
      return err.error.errors[firstKey];
    }

    return 'Something went wrong. Please try again.';
  }

}
