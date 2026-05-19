import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Agency, AgencyRequestDto, AgencyResponseDto } from '../../interfaces/agency';

@Injectable({
  providedIn: 'root'
})
export class AgencyService {

  private baseUrl = 'http://localhost:8080/api/agency';

  constructor(private http: HttpClient) {}

  /** Get all agencies */
  getAllAgencies(): Observable<AgencyResponseDto[]> {
    return this.http.get<AgencyResponseDto[]>(`${this.baseUrl}/getAllAgency`);
  }
  getAllAgencie(): Observable<Agency[]> {
    return this.http.get<Agency[]>(`${this.baseUrl}/getAllAgency`);
  }

  /** Get agency by ID */
  getAgencyById(agencyId: number): Observable<AgencyResponseDto> {
    return this.http.get<AgencyResponseDto>(`${this.baseUrl}/${agencyId}`);
  }

  /** Add agency with optional file */
  addAgency(agency: Partial<Agency>): Observable<AgencyResponseDto> {

    return this.http.post<AgencyResponseDto>(`${this.baseUrl}/addAgency`, agency);
  }

  /** Update agency with optional file */
  editAgency(
    agencyId: number,
    agency: Partial<Agency>
  ): Observable<AgencyResponseDto> {

    return this.http.put<AgencyResponseDto>(
      `${this.baseUrl}/update/${agencyId}`,
      agency
    );
  }

  /** Delete agency */
  deleteAgency(agencyId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/deleteAgency/${agencyId}`
    );
  }

  /** Activate / Deactivate agency */
  agencyStatus(agencyId: number, isActive: boolean): Observable<AgencyResponseDto> {
    return this.http.put<AgencyResponseDto>(
      `${this.baseUrl}/status/${agencyId}?isActive=${isActive}`,
      {}
    );
  }


getAgencyUsers(agencyId: number, page: number, size: number) {
  return this.http.get<any>(
    `${this.baseUrl}/${agencyId}/users?page=${page}&size=${size}`
  );
}

}
