export interface CustomerRequest {
  companyName: string;
  contactNo: string;
  billingEmail: string;
  managedBy: string;
  registrationNumber: string;
  billingAddress: string;
  status: string;
  agencyId: number;
}

export interface CustomerResponse extends CustomerRequest {
  id: number;
  companyLogo: string;
  createdAt: string;
  updatedAt: string;
  agencyName: string;
  branches: any[];
  campaigns: any[];
}