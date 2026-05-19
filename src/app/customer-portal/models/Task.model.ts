export interface Task {
  id?: number;
  title: string;
  description: string;

  allDay: boolean;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;

  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

  assignedToId?: number;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedCustomerUserId?: number;

  createdByUserId?: number;
  createdByUserName?: string;

  createdByCustomerUserId?: number;
  createdByCustomerName?: string;

  assignedBranchUserId?: number;
  assignedBranchUserName?: string;

  createdByBranchUserId?: number;
  createdByBranchUserName?: string;

  agencyId?: number;
  leadId?: number;
  leadName?: string;
  customerId?:number;

  createdAt?: string;
  updatedAt?: string;

  day?: string;
}
