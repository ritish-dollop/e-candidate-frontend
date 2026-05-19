export interface Campaign {
  id: number;
  name: string;
  description: string;
  status: string;
  customerId: number;
  customerName: string;
  customerLogo:string,
  leadIds: number[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;

  totalLeads: number;
  overdueCount: number;
  unaddressedCount: number;
  lastLeadDate: string | null;
  progress: { [status: string]: number }; // example: { "HIRED": 40, "REJECTION": 20 }
}