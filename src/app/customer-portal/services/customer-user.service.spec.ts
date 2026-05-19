import { TestBed } from '@angular/core/testing';

import { CustomerUserService } from './customer-user.service';

describe('CustomerUserService', () => {
  let service: CustomerUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
