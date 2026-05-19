export interface JobPost {
  id?: number;
  jobTitle: string;
  description: string;
  department: string;
  experienceLevel: string;
  location: string;
  requiredSkills: string;
  branchId?: number;
  branchName?: string;
  customerId?: number;
  customerName?: string;
  agencyId?:number;
  createdById : number; 
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  workMode:'ONSITE' | 'REMOTE' | 'HYBRID';
  workType:| 'FULL_TIME'| 'PART_TIME'
  image: string ;
  createdAt?: string;
  updatedAt?: string;
}
