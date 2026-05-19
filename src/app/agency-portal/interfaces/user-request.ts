export enum ChatUserType {
  AGENCY_USER = 'AGENCY_USER',
  BRANCH_USER = 'BRANCH_USER',
  CUSTOMER_USER = 'CUSTOMER_USER'
}
export enum UserRole {
  AGENCY_SUPER_ADMIN = 'AGENCY_SUPER_ADMIN',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  AGENCY_RELATIONSHIP_MANAGER = 'AGENCY_RELATIONSHIP_MANAGER',
  AGENCY_TEAM_MEMBER = 'AGENCY_TEAM_MEMBER',

  CUSTOMER_ADMIN = 'CUSTOMER_ADMIN',
  CUSTOMER_TEAM_MEMBER = 'CUSTOMER_TEAM_MEMBER',

  BRANCH_ADMIN = 'BRANCH_ADMIN',
  BRANCH_TEAM_MEMBER = 'BRANCH_TEAM_MEMBER'
}


export interface ChatUserResponseDto {
  /** Chat system ka ID */
  commonUserId: number;

  /** Actual user ka ID (User / CustomerUser / BranchUser) */
  referenceUserId: number;

  name: string;
  email: string;
  profilePicture?: string;
  phone?: string;

  belongToId?: number;
  belongToName?: string;

  type: ChatUserType;   // AGENCY / CUSTOMER / BRANCH
  role: UserRole;

  lastLogin?: string;   // ISO string from backend
  createdAt?: string;
  updatedAt?: string;
}


export interface UserRequest {

  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  status: string;
  agencyId: number ;
  profilePicture?: string;
}

export interface UserResponse {
  id: number;
  profilePicture: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  password:string;
  agencyName?: string;
  agencyId?: number;
  status: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}
