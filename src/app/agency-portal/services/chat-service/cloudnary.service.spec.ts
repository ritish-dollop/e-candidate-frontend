import { TestBed } from '@angular/core/testing';

import { CloudnaryService } from './cloudnary.service';

describe('CloudnaryService', () => {
  let service: CloudnaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CloudnaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
