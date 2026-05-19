import { TestBed } from '@angular/core/testing';
import { AgencyService } from './services.service';

// import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: AgencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgencyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
