import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../../services/branch.service';
import { Branch } from '../../../models/Branch.model';
import { AuthService } from '../../../../auth/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.css'
})
export class BranchListComponent {

  roles: string[] = [];
  branches: Branch[] = [];

  // Pagination
  page = 0;
  size = 9;
  totalPages = 0;

  // Form Controls
  showForm = false;
  editMode = false;

  form: Branch = {
    id: undefined,
    branchName: '',
    branchAddress: '',
    contactNo: '',
    billingEmail: '',
    status: 'ACTIVE',
    customerId: 1
  };

  constructor(
    private router: Router,
    private branchService: BranchService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.roles = this.auth.getUserRoles();
    this.loadBranches();
  }

  // Only CUSTOMER_ADMIN can add/edit/delete branch
  isAdmin(): boolean {
    return this.roles.includes('CUSTOMER_ADMIN');
  }

  // TEAM MEMBER has no branch management right
  isTeamMember(): boolean {
    return this.roles.includes('CUSTOMER_TEAM_MEMBER');
  }

  // Load branches
  loadBranches() {
    this.branchService.getAll(this.page, this.size).subscribe({
      next: (data) => {
        this.branches = data.content;
        this.totalPages = data.totalPages;
      },
      error: (err) => console.error(err),
    });
  }

  // Start Add Branch
  startAdd() {
    if (!this.isAdmin()) return;   // safety check

    this.editMode = false;
    this.showForm = true;
    
    this.form = {
      id: undefined,
      branchName: '',
      branchAddress: '',
      contactNo: '',
      billingEmail: '',
      status: 'ACTIVE',
      customerId: 1
    };
  }

  // Start Edit Branch
  startEdit(branch: Branch) {
    if (!this.isAdmin()) return;

    this.editMode = true;
    this.showForm = true;
    this.form = { ...branch };
  }

  cancelForm() {
    this.showForm = false;
  }

  saveBranch() {
  if (!this.isAdmin()) return;

  if (this.editMode) {
    this.branchService.update(this.form.id!, this.form).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Branch updated successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadBranches();
        this.showForm = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to update branch!',
        });
      },
    });

  } else {
    this.branchService.create(this.form).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Added',
          text: 'Branch added successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadBranches();
        this.showForm = false;
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to add branch!',
        });
      },
    });
  }
}


  toggleStatus(branch: Branch) {
  if (!this.isAdmin()) return;

  const newStatus = branch.status === 'ACTIVE' ? 'DEACTIVE' : 'ACTIVE';

  Swal.fire({
    title: 'Are you sure?',
    text:
      newStatus === 'DEACTIVE'
        ? 'This branch will be deactivated!'
        : 'This branch will be activated!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText:
      newStatus === 'DEACTIVE' ? 'Yes, deactivate!' : 'Yes, activate!',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (!result.isConfirmed) return;

    this.branchService.changeStatus(branch.id!, newStatus).subscribe({
      next: () => {
        branch.status = newStatus;

        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: `Branch ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully!`,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        console.error('❌ Status update error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to update branch status!',
        });
      },
    });
  });
}


  deleteBranch(id: number) {
  if (!this.isAdmin()) return;

  Swal.fire({
    title: 'Are you sure?',
    text: 'This branch will be deleted!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete!',
    cancelButtonText: 'Cancel',
  }).then((result) => {
    if (!result.isConfirmed) return;

    this.branchService.delete(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Branch deleted successfully!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.loadBranches();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to delete branch!',
        });
      },
    });
  });
}


  viewBranchUsers(branchId: number) {
    this.router.navigate(['/home/branches', branchId, 'users']);
  }

  // Pagination
  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadBranches();
    }
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadBranches();
    }
  }

  goToPage(pageNumber: number) {
    this.page = pageNumber;
    this.loadBranches();
  }
  onBranchStatusClick(event: MouseEvent, branch: Branch) {
  event.preventDefault();   
  event.stopPropagation();  

  this.toggleStatus(branch);
}

}
