export interface Agency {
  id: number|null;
  agencyName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  notes: string;
  status: string;

  userIds: number[];
  customerIds: number[];
  createdAt: string;      // ISO date-time string
  updatedAt: string;      // ISO date-time string
}
export interface AgencyResponseDto {
  id: number;
  agencyName: string;
  email: string;
  phone: string;
  address: string;
  logo?: string | null;
  notes?: string | null;
  status: string;

  userIds: number[];
  customerIds: number[];

  createdAt: string;   // ISO date-time from backend
  updatedAt: string;   // ISO date-time from backend
}
export interface AgencyRequestDto {
  agencyName: string;
  email: string;
  phone: string;
  address: string;
  logo?: string | null;
  notes?: string | null;
  status?: 'ACTIVE' | 'INACTIVE'; // default handled by backend
}
