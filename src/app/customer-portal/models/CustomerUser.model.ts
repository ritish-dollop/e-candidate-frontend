export interface CustomerUser {
  id: number;
  profilePicUrl: string | null;
  name: string;
  email: string;
  contactNo: string;
  role: 'CUSTOMER_ADMIN' | 'CUSTOMER_TEAM_MEMBER';
  status: 'ACTIVE' | 'DEACTIVE';
  customerId: number;
  customerName?: string;       // optional (available in response)
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface CustomerUserResponse {
  id: number;
  name: string;
  email: string;
  position: string;
  contactNo: string;
  profilePicUrl: string;
  role: string;
  password: string;
  status: string;
  customerId: number;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

export interface CustomerUserRequest {
  profilePic: File | null;
  name: string;
  email: string;
  position: string;
  contactNo: string;
  password: string;
  role: string;
  status: string;
  customerId: number;
}
