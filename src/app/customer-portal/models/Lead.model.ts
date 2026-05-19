export interface Lead {
  find(arg0: (l: any) => boolean): unknown;
  contactNo: string;
  campaign: any;
  name: any;
  id?: number;                  
  applicantName: string;              
  email: string;                
  phone: string;                
  source?: string;              
  status: string;              
  campaign_id?: number;        
  commentCount?:number;
  campaignName:string;
  createdAt?: string;         
  lastEditDate?: string;
  updatedDate?: string;         
  assignedTo?: string;                     
  files?: LeadFile[];           
  tasks?: LeadTask[];           
  profileImageUrl?: string;
  scorecardScore?:string;
  resumeFileName ?:string;
  active : boolean
}

export interface LeadFile {
  id?: number;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate?: string;
}

export interface LeadTask {
  id?: number;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  status?: string;
}
