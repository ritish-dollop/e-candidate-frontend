import { Component } from '@angular/core';
import { BranchUser } from '../../../models/BranchUser.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchUserService } from '../../../services/branch-user.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../auth/services/auth.service';
import Swal from 'sweetalert2';
import { CustomerRolePipe } from '../../../Pipe/customer-role.pipe';

@Component({
  selector: 'app-branch-user',
  imports: [CommonModule, FormsModule, CustomerRolePipe],
  templateUrl: './branch-user.component.html',
  styleUrl: './branch-user.component.css',
})
export class BranchUserComponent {
  branchId!: number;
  branchInfo: any;
  branchUsers: BranchUser[] = [];

  page = 0;
  size = 4;
  totalPages = 0;

  // Popup State
  showUserForm = false;
  isEditMode = false;

  showResetPopup = false;
  resetPasswordData = {
    userId: null as number | null,
    newPassword: '',
  };

  // Form Model
  userData: any = {
    name: '',
    email: '',
    contactNo: '',
    position: '',
    role: 'BRANCH_TEAM_MEMBER',
    password: '',
    profilePic: null,
  };

  uploadedImageUrl: string | null = null;

  roles: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private branchUserService: BranchUserService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    console.log('Roles in BranchUserComponent:', this.roles);

    this.branchId = +this.route.snapshot.paramMap.get('id')!;
    this.loadUsers();
    this.getBranchDetails(this.branchId);
  }

  isBranchAdmin(): boolean {
    return (
      this.roles.includes('CUSTOMER_ADMIN') ||
      this.roles.includes('BRANCH_ADMIN')
    );
  }

  isBranchTeamMember(): boolean {
    return this.roles.includes('BRANCH_TEAM_MEMBER');
  }
  hasBranchAdmin(): boolean {
  return this.branchUsers.some(u => u.role === 'BRANCH_ADMIN');
}


  loadUsers() {
    this.branchUserService
      .getUsersByBranch(this.branchId, this.page, this.size)
      .subscribe({
        next: (data) => {
          this.branchUsers = data.content;
          this.totalPages = data.totalPages;
        },
        error: (err) => console.error('Error loading users:', err),
      });
  }

  openAddUser() {
    if (!this.isBranchAdmin()) return;

    this.isEditMode = false;
    this.userData = {
      name: '',
      email: '',
      contactNo: '',
      position: '',
      role: 'BRANCH_TEAM_MEMBER',
      password: '',
      profilePic: null,
    };
    this.uploadedImageUrl = null;
    this.showUserForm = true;
  }


  openEditUser(user: BranchUser) {
    if (!this.isBranchAdmin()) return;

    this.isEditMode = true;

    this.userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      contactNo: user.contactNo,
      position: user.position,
      role: user.role,
      password: user.password,
      profilePic: null,
    };

    this.uploadedImageUrl = (user as any).profilePic || null;
    this.showUserForm = true;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.userData.profilePic = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedImageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeUploadedImage(fileInput?: HTMLInputElement) {
    this.userData.profilePic = null;
    this.uploadedImageUrl = null;
    if (fileInput) fileInput.value = '';
  }

  saveUser() {
    const payload = {
      name: this.userData.name,
      email: this.userData.email,
      contactNo: this.userData.contactNo,
      position: this.userData.position,
      role: this.userData.role,
      password: this.isEditMode ? null : this.userData.password,
      branchId: this.branchId,

      status: this.isEditMode
        ? this.branchUsers.find((u) => u.id === this.userData.id)?.status ??
          'ACTIVE'
        : 'ACTIVE',
    };

    const file = this.userData.profilePic || undefined;

    Swal.fire({
      title: this.isEditMode ? 'Update User?' : 'Add User?',
      text: this.isEditMode
        ? 'Are you sure you want to update this user?'
        : 'Are you sure you want to add this user?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.isEditMode ? 'Yes, update!' : 'Yes, add!',
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (!this.isEditMode) {
        const tempId = Date.now();
        const optimisticUser: BranchUser = {
          id: tempId,
          name: payload.name,
          email: payload.email,
          contactNo: payload.contactNo,
          position: payload.position,
          role: payload.role,
          status: 'ACTIVE',
          password: '******',
          branchId: this.branchId,
          profilePic: this.uploadedImageUrl || undefined,
        };

        this.closeUserForm();
        // this.branchUsers = [optimisticUser, ...this.branchUsers];

        Swal.fire({
          title: 'Creating user...',
          text: 'Please wait',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        this.branchUserService.addUser(this.branchId, payload, file).subscribe({
          next: () => {
            Swal.close();

            Swal.fire({
              icon: 'success',
              title: 'Added',
              text: 'User added successfully.',
              timer: 1500,
              showConfirmButton: false,
            });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Create failed:', err);

            const errorMessage = this.getErrorMessage(err);

            Swal.fire({
              icon: 'error',
              title: err.status === 409 ? 'Duplicate Email' : 'Error',
              text: errorMessage,
            });

            // this.branchUsers = this.branchUsers.filter((u) => u.id !== tempId);
          },
        });

        return;
      }

      const userId = this.userData.id; 

      if (!userId) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid User',
          text: 'User ID is missing. Please refresh the page.',
        });
        return;
      }

      const updatePayload = { ...payload };

      this.closeUserForm(); 

      this.branchUserService.updateUser(userId, updatePayload, file).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: 'User updated successfully.',
          });
          this.loadUsers();
        },
        error: (err) => {
          console.error('Update failed:', err);

          const errorMessage = this.getErrorMessage(err);

          Swal.fire({
            icon: 'error',
            title: err.status === 409 ? 'Duplicate Email' : 'Update Failed',
            text: errorMessage,
          });
        },
      });
    });
  }

  closeUserForm() {
    this.showUserForm = false;
    this.userData = {
      name: '',
      email: '',
      contactNo: '',
      position: '',
      role: 'BRANCH_TEAM_MEMBER',
      password: '',
      profilePic: null,
    };
    this.uploadedImageUrl = null;
  }

  toggleStatus(user: BranchUser) {
    if (!this.isBranchAdmin()) return;

    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';

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
      if (!result.isConfirmed) return;

      this.branchUserService.toggleStatus(user.id!, newStatus).subscribe({
        next: (updatedUser) => {
          user.status = updatedUser.status;

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
          console.error('❌ Failed to change status:', err);

          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to update user status!',
          });
        },
      });
    });
  }

  deleteUser(id?: number) {
    if (!this.isBranchAdmin()) return;
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
        const index = this.branchUsers.findIndex((u) => u.id === id);
        const backup = this.branchUsers[index];

        this.branchUsers.splice(index, 1);

        this.branchUserService.deleteUser(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'User deleted successfully.',
            });
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.branchUsers.splice(index, 0, backup);
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

  getBranchDetails(branchId: number) {
    this.branchUserService.getBranchDetails(branchId).subscribe({
      next: (data) => (this.branchInfo = data),
      error: (err) => console.error('Failed to load branch details:', err),
    });
  }

  resetPassword(user: BranchUser) {
    if (!this.isBranchAdmin()) return;

    this.showResetPopup = true;
    this.resetPasswordData = {
      userId: user.id!,
      newPassword: '',
    };
  }

  submitResetPassword() {
    if (!this.resetPasswordData.newPassword.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Password',
        text: 'Password cannot be empty',
      });
      return;
    }

    this.branchUserService
      .resetPassword(
        this.resetPasswordData.userId!,
        this.resetPasswordData.newPassword
      )
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Password reset successfully',
            timer: 1500,
            showConfirmButton: false,
          });
          this.showResetPopup = false;
        },
        error: (err) => {
          console.error('Failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: 'Failed to reset password',
          });
        },
      });
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.page = page;
      this.loadUsers();
    }
  }

  goBack() {
    this.router.navigate(['/home/branches']);
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

  onBranchUserStatusClick(event: MouseEvent, user: BranchUser) {
    event.preventDefault();
    event.stopPropagation();

    this.toggleStatus(user);
  }
}
