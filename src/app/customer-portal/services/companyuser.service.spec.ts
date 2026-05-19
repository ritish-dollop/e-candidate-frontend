import { TestBed } from '@angular/core/testing';

import { CompanyuserService } from './companyuser.service';

describe('CompanyuserService', () => {
  let service: CompanyuserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompanyuserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
