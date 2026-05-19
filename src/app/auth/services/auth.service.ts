import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  header = new HttpHeaders().set('content-type', 'application/json');

  
  login(data: { email: string; password: string }): Observable<any>  {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  verifyOtp(data: { email: string; otp: string; type: string }) {
    return this.http.post<any>(`${this.baseUrl}/verify-otp`, data).pipe(
      tap((res: any) => {

        if (res.token) {
          this.saveToken(res.token);
        }

        // ✅ Save roles from backend (correct location)
        if (res.roles) {
          this.saveRoles(res.roles);

        }
        
        // 🔥 CLEAR OLD IDS
        localStorage.removeItem('customerUserId');
        localStorage.removeItem('userId');

        if (res.user) {

          const role =
            res.user?.role ||
            (Array.isArray(res.roles) ? res.roles[0] : null);
        
          console.log('🔥 LOGIN ROLE:', role);
        
          // ✅ CUSTOMER
          if (role === 'CUSTOMER_TEAM_MEMBER' || role === 'CUSTOMER_ADMIN') {
        
            localStorage.setItem('customerUserId', String(res.user.id));
        
            if (res.user.customerId) {
              localStorage.setItem('customerId', String(res.user.customerId));
            } else {
              console.error('❌ customerId missing in res.user');
            }
          }
        
          // ✅ AGENCY
          else if (role?.startsWith('AGENCY')) {
            localStorage.setItem('userId', String(res.user.id));
          }
        
          // ✅ BRANCH  ⭐⭐⭐ MAIN FIX
          else if (role?.startsWith('BRANCH')) {
        
            localStorage.setItem('branchUserId', String(res.user.id));
        
            if (res.user.branchId) {
              localStorage.setItem('branchId', String(res.user.branchId));
              console.log('✅ branchId saved at login:', res.user.branchId);
            } else {
              console.error('❌ branchId missing in login response', res.user);
            }
          }
        }
        

          console.log('ROLES =>', res.roles);
          console.log('customerUserId =>', localStorage.getItem('customerUserId'));
          console.log('userId =>', localStorage.getItem('userId'));
      })
    );
}

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-otp/${email}`, {}, { headers: this.header });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-otp/${email}`, {}, { headers: this.header });
  }


  changePassword(email: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password`, { email, password: newPassword }, {
      headers: this.header
    });
  }

  saveToken(token: string): void {
    localStorage.setItem('jwtToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('customerUserId');
    localStorage.removeItem('userId');
    localStorage.removeItem('campaignId');
    // Clear all localStorage data
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }


  saveRoles(roles: string[]): void {
    localStorage.setItem("userRoles", JSON.stringify(roles));
  }

  getUserRoles(): string[] {
    const roles = localStorage.getItem("userRoles");
    console.log(roles);

    return roles ? JSON.parse(roles) : [];
  }


   private getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }


  getCustomerId(): number | null {
    const cid = localStorage.getItem('customerId');
    return cid ? Number(cid) : null;
  }

  getCustomerUserId(): number | null {
    const uid = localStorage.getItem('customerUserId');
    return uid ? Number(uid) : null;
  }
  getAgencyUserIdFromJwt(): number | null {
    const decoded = this.getDecodedToken();
    const uid = decoded?.userId ?? decoded?.id ?? null;
    return uid ? Number(uid) : null;
  }
  getCustomerIdFromJwt(): number | null {
    const decoded = this.getDecodedToken();
    const cid = decoded?.customerId ?? decoded?.customer_id ?? null;
    return cid ? Number(cid) : null;
  }

  getCurrentUser(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: "Bearer " + token
    });
    return this.http.get<any>("http://localhost:8080/api/user/me", { headers });
  }


   private setUserContextFromJwt(roles: string[]) {
    // Clear old IDs
    localStorage.removeItem('customerUserId');
    localStorage.removeItem('userId');

    const decoded = this.getDecodedToken();
    if (!decoded) return;

    // CUSTOMER TEAM MEMBER
    if (roles.includes('CUSTOMER_TEAM_MEMBER')) {
      const customerUserId =
        decoded.customerUserId ??
        decoded.customerId ??
        decoded.customer_id;

      if (customerUserId) {
        localStorage.setItem(
          'customerUserId',
          String(customerUserId)
        );
      }
      return;
    }

    // AGENCY USERS
    if (roles.some((r) => r.startsWith('AGENCY'))) {
      const userId = decoded.userId ?? decoded.id;
      if (userId) {
        localStorage.setItem('userId', String(userId));
      }
    }
  }
}
