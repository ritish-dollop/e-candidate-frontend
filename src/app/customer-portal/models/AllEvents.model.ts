export interface AllEvents {
  id?: number;
  title: string;
  description: string;
  startDate: string;     
  endDate: string;       

  startTime?: string | null;  
  endTime?: string | null;      

  allDay: boolean;
  location: string;
  address?: string;
  googleMeetLink?: string | null; 

  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

  assignedUserId?: number | null; 
  assigneeId?: number | null;            
  assigneeName?: string;
  assigneeEmail?: string;

  assignedCustomerUserId?: number | null; 
  assignedCustomerUserName?: string;
  assignedCustomerUserEmail?: string;

  createdByUserId?: number | null;
  createdByCustomerUserId?: number | null;

  assignedBranchUserId?: number | null;
  assignedBranchUserName?: string;
  createdByBranchUserId?: number | null;
  createdByBranchUserName?: string;

  agencyId?: number | null;
  agencyName?: string;

  createdAt?: string;
  updatedAt?: string;

  date?: string;
  day?: string;
}
