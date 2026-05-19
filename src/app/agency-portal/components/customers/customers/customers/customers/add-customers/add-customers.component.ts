import { Component, ElementRef, ViewChild } from '@angular/core';

import Swal from 'sweetalert2';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CompanyuserService } from '../../../../../../../customer-portal/services/companyuser.service';
import { Agency } from '../../../../../../interfaces/agency';
import { CustomerResponse } from '../../../../../../interfaces/customer';
import { AgencyService } from '../../../../../../services/agency-service/services.service';
import { CloudinaryService } from '../../../../../../services/chat-service/cloudnary.service';
import { CustomerService } from '../../../../../../services/Customer/Customer.service';



@Component({
  selector: 'app-add-customers',
  imports: [CommonModule,FormsModule,RouterModule],
  templateUrl: './add-customers.component.html',
  styleUrl: './add-customers.component.css'
})
export class AddCustomersComponent {
  customers: CustomerResponse[] = [];
  filtered: CustomerResponse[] = [];

  search: string = '';
  defaultLogo = 'assets/images/svg-img/E.svg';
  defaultAdminAvatar = 'assets/images/svg-img/Avatar.svg';



  agencies: { id: number, name: string }[] = [];

  showAddPage = false;
  activeTab: 'company' | 'admin' = 'company';
  page = 0;
size = 6;
totalPages = 0;
totalElements = 0;
managedByName: string = '';

  company: any = {
    companyName: '',
    companyLogo : '',
    contactNo: '',
    billingEmail: '',
    managedBy: '',
    registrationNumber: '',
    billingAddress: '',
    createdAt:'',
    updatedAt:'',
    status: 'ACTIVE',
    agencyId: null
  };

  companyLogoFile: File | null = null;
  companyLogoPreview: string | null = null;
  @ViewChild('companyLogoInput') companyLogoInput!: ElementRef;

  admin: any = {
    adminName: '',
    contactNo: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  formErrors: any = {};

  adminPhotoFile: File | null = null;
  adminPhotoPreview: string | null = null;
  @ViewChild('adminPhotoInput') adminPhotoInput!: ElementRef;

  constructor(private api: CustomerService, private cloudService : CloudinaryService
  ,private location:Location,private router:Router, private agencyService:AgencyService,
  private customerUserService:CompanyuserService
  ) {}

  ngOnInit() {
    const storedAgencyId = localStorage.getItem('agencyId');

  if (storedAgencyId) {
    this.company.agencyId = Number(storedAgencyId);
  }

   this.companyLogoPreview = this.defaultLogo;
  this.company.companyLogo = null;

  this.adminPhotoPreview = this.defaultAdminAvatar;
  this.adminPhotoFile = null;

    this.load();
      this.loadAgencies();
    this.showAddPage = true;
  }

  // -----------------------------------------
  // LOAD CUSTOMERS
  // -----------------------------------------
  load() {
  this.api.getAllPaginated(this.page, this.size).subscribe(res => {
    this.customers = res.content;
    this.filtered = res.content;

    this.totalPages = res.totalPages;
    this.totalElements = res.totalElements;
  });
}


  loadAgencies() {
  this.agencyService.getAllAgencie().subscribe((res: Agency[]) => {
    this.agencies = res.map(a => ({
      id: a.id!,
      name: a.agencyName
    }));

    // 🔥 set agencyId ONLY if not already set
    if (!this.company.agencyId && this.agencies.length > 0) {
      this.company.agencyId = this.agencies[0].id;
    }

    const agency = this.agencies.find(a => a.id === this.company.agencyId);
    if (agency) {
      this.managedByName = agency.name;
    }
  });
}

    openAdd() {
      this.showAddPage = true;
      this.activeTab = 'company';

      this.company = {
        companyName: '',
        companyLogo : '',
        contactNo: '',
        billingEmail: '',
        managedBy: '',
        registrationNumber: '',
        billingAddress: '',
        createdAt:'',
        updatedAt:'',
        status: 'ACTIVE',
        agencyId: this.company.agencyId,
        logoFile: null
      };

      this.companyLogoFile = null;
        this.companyLogoPreview = this.defaultLogo;

      this.admin = {
        adminName: '',
        adminLogo:'',
        contactNo: '',
        email: '',
        password: '',
        confirmPassword: '',
         profilePic: null
      };

      this.adminPhotoFile = null;
      this.adminPhotoPreview =  this.defaultAdminAvatar;
    }

    cancelAdd() {
      this.showAddPage = false;
      this.router.navigate(['/agency/customer/card']);
    }



   onFileSelected(event: Event, type: 'company' | 'admin') {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = () => {

    if (type === 'company') {
      this.company.logoFile = file;
      this.companyLogoPreview = reader.result as string;
    }

    if (type === 'admin') {
      this.admin.profilePic = file;
      this.adminPhotoPreview = reader.result as string;
    }
  };
  reader.readAsDataURL(file);
}

submitCompany(form: any) {
  if (form.invalid) return;

  if (this.company.logoFile) {
    this.cloudService.uploadFile(this.company.logoFile).then(url => {
      this.company.companyLogo = url;
      this.createCompany();
    });
  } else {
    this.company.companyLogo = null;
    this.createCompany();
  }
}

submitAdmin(form: any) {
  if (
    form.invalid ||
    this.admin.password !== this.admin.confirmPassword ||
    this.adminEmailExists
  ) {
    return;
  }

  this.createAdmin();
}



private createCompany() {
  this.api.create(this.company).subscribe({
    next: (res: any) => {
      this.company.id = res.id;

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Company created, add admin now',
        showConfirmButton: false,
        timer: 2500
      });

      this.activeTab = 'admin';
    },
    error: () => Swal.fire('Error', 'Customer creation failed', 'error')
  });
}

  createAdmin() {

  const formData = new FormData();

  formData.append('name', this.admin.adminName);
  formData.append('email', this.admin.email);
  formData.append('contactNo', this.admin.contactNo);
  formData.append('password', this.admin.password);
  formData.append('customerId', String(this.company.id));
  formData.append('role', 'CUSTOMER_ADMIN');
  formData.append('status', 'ACTIVE');
  formData.append('position', 'Admin');

  if (this.admin.profilePic) {
    formData.append('profilePic', this.admin.profilePic);
  }

  this.customerUserService.createUser(formData).subscribe({

    next: () => {
      this.showAddPage = false;
      Swal.fire({
        icon: 'success',
        title: 'Admin Added',
        text: 'Company admin created successfully',
        confirmButtonText: 'OK'
      }).then(() => {

        this.load();
        this.router.navigate(['/agency/customer/card']);
      });
    },

    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err?.error?.message || 'Admin creation failed'
      });
    }

  });
}
emailExists = false;
registrationExists = false;
adminEmailExists = false;

checkEmailDuplicate() {
  const email = this.company.billingEmail?.trim().toLowerCase();

  if (!email) {
    this.emailExists = false;
    return;
  }

  this.emailExists = this.customers.some(
    c => c.billingEmail?.toLowerCase() === email
  );
}
checkRegistrationDuplicate() {
  const reg = this.company.registrationNumber?.trim().toLowerCase();

  if (!reg) {
    this.registrationExists = false;
    return;
  }

  this.registrationExists = this.customers.some(
    c => c.registrationNumber?.toLowerCase() === reg
  );
}

checkAdminEmailDuplicate() {
  const email = this.admin.email?.trim().toLowerCase();

  if (!email) {
    this.adminEmailExists = false;
    return;
  }

  // 🔥 same customer ke andar duplicate check
  this.adminEmailExists = this.customers.some((c: any) =>
    c?.customerUsers?.some(
      (u: any) => u.email?.toLowerCase() === email
    )
  );
}

    delete(c: CustomerResponse) {
      Swal.fire({
        title: "Are you sure?",
        text: c.companyName,
        icon: "warning",
        showCancelButton: true
      }).then(res => {
        if (res.isConfirmed) {
          this.api.delete(c.id).subscribe(() => {
            Swal.fire("Deleted!", "", "success");
            this.load();
          });
        }
      });
    }


   goBack() {
    this.location.back();
  }

}
