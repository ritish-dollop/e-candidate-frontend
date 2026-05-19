export interface Note{
  id: number;
  content: string;
  leadId?: number | null;
  leadName?: string | null;
  agencyId?: number | null;
  agencyName?: string | null;
  createdById: number;
  createdByName?: string | null;
  createdAt: string;     // LocalDateTime comes as ISO string from backend
  updatedAt: string;
}  