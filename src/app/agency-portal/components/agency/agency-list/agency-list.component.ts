import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Agency, AgencyResponseDto } from '../../../interfaces/agency';
import { HttpClientModule } from '@angular/common/http';
import { AgencyService } from '../../../services/agency-service/services.service';
import { CloudinaryService } from '../../../services/chat-service/cloudnary.service';
import { UserResponse } from '../../../interfaces/user-request';
import { AuthService } from '../../../../auth/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { noop } from 'rxjs';

@Component({
  selector: 'app-agency-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule , RouterLink],
  templateUrl: './agency-list.component.html',
  styleUrls: ['./agency-list.component.css'],
})
export class AgencyListComponent implements OnInit {
  agencies: AgencyResponseDto[] = [];
  loading = false;
  errorMessage = '';
  logoUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isEditMode = false;
  url: string | null = null;
  agencyForm: Partial<Agency> = {
    id: null,
    agencyName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    logo: '',
    status: 'ACTIVE',
  };

  currentPage = 1;
  itemsPerPage = 5;
  currentUser!: UserResponse | null;

  constructor(
    private serv: AgencyService,
    private cloudinaryService: CloudinaryService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.getAllAgencies();
    this.loadUser();
  }
  loadUser() {
    this.auth.getCurrentUser().subscribe({
      next: (res: UserResponse) => {
        console.log(res);
        this.currentUser = res;

        this.loading = false;
        this.getAllAgencies();


      },
      error: (err) => {
        this.loading = false;

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
  /** ✅ Fetch all agencies */
  getAllAgencies(): void {
    this.loading = true;
    this.serv.getAllAgencies().subscribe({
      next: (res) => {
        this.agencies = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load agencies';
        this.loading = false;
      },
    });
  }

  /** ✅ Handle image file select + preview */
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('⚠️ Please select a valid image file (jpg, png, jpeg)');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      console.log(this.selectedFile);

      if (this.selectedFile) {
        try {
          const url = await this.cloudinaryService.uploadFile(
            this.selectedFile
          );

          if (url) {
            this.url = url; // preview / display
            this.agencyForm.logo = url; // send to backend
          }
        } catch (error) {
          console.error('Upload error:', error);
        }
      }

      const reader = new FileReader();
      reader.onload = () => (this.logoUrl = reader.result);
      reader.readAsDataURL(file);
    }
  }

  /** ✅ Add or Update Agency */
  onSubmitAgency(form: NgForm) {
    if (!form.valid) {
      Object.values(form.controls).forEach((control) =>
        control.markAsTouched()
      );
      return;
    }

    if (this.url) {
      this.agencyForm.logo = this.url;
    }
    console.log(this.agencyForm);

    if (this.isEditMode && this.agencyForm.id) {
      this.serv.editAgency(this.agencyForm.id, this.agencyForm).subscribe({
        next: (res) => {
          alert('✅ Agency updated successfully!');
          const index = this.agencies.findIndex((a) => a.id === res.id);
          if (index !== -1) this.agencies[index] = res;
          this.resetForm();
        },
        error: (err) => {
          console.error('❌ Error updating agency:', err);
          alert('❌ Failed to update agency');
        },
      });
    } else {
      this.serv.addAgency(this.agencyForm).subscribe({
        next: (res) => {
          alert('✅ Agency added successfully!');
          this.agencies.push(res);
          this.resetForm();
        },
        error: (err) => {
          console.error('❌ Error adding agency:', err);
          alert('❌ Failed to add agency');
        },
      });
    }
  }

  /** ✅ Edit agency */
  onEditAgency(agency: AgencyResponseDto): void {
    this.isEditMode = true;
    this.agencyForm.id = agency.id; //  = { ...agency };
    this.agencyForm.agencyName = agency.agencyName;
    this.agencyForm.email = agency.email;
    this.agencyForm.phone = agency.phone;
    this.agencyForm.address = agency.address;
    this.agencyForm.notes = agency.notes ? agency.notes : '';
    this.agencyForm.logo = agency.logo ? agency.logo : '';
    this.agencyForm.status = agency.status;
    this.logoUrl = agency.logo || null;
  }

  /** ✅ Delete agency */
  onDeleteAgency(id: number): void {
    if (confirm('🗑️ Are you sure you want to delete this agency?')) {
      this.serv.deleteAgency(id).subscribe({
        next: () => {
          this.agencies = this.agencies.filter((a) => a.id !== id);
          alert('✅ Agency deleted successfully!');
        },
        error: (err) => {
          console.error(err);
          alert('❌ Failed to delete agency');
        },
      });
    }
  }

  /** ✅ Toggle Status */
  onToggleStatus(agency: AgencyResponseDto): void {
    const newStatus = agency.status === 'ACTIVE' ? false : true;
    this.serv.agencyStatus(agency.id!, newStatus).subscribe({
      next: (res) => {
        agency.status = res.status;
        alert(`✅ Agency status changed to ${res.status}`);
      },
      error: (err) => {
        console.error('❌ Error changing status:', err);
        alert('⚠️ Failed to update status');
      },
    });
  }

  /** ✅ Pagination */
  goToPage(page: number): void {
    if (page < 1 || page > Math.ceil(this.agencies.length / this.itemsPerPage))
      return;
    this.currentPage = page;
  }

  get paginatedAgencies(): AgencyResponseDto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.agencies.slice(start, start + this.itemsPerPage);
  }

  /** ✅ Reset Form */
  resetForm(): void {
    this.agencyForm = {
      id: null,
      agencyName: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      logo: '',
      status: 'ACTIVE',
    };
    this.selectedFile = null;
    this.logoUrl = null;
    this.isEditMode = false;
  }

//   viewAgency(id: number) {
//   this.router.navigate(['agency/details', id]);
// }

}
