import { TestBed } from '@angular/core/testing';

import { ChatServicesService } from './chat-services.service';

describe('ChatServicesService', () => {
  let service: ChatServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
