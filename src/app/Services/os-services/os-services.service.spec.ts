import { TestBed } from '@angular/core/testing';

import { OsServicesService } from './os-services.service';

describe('OsServicesService', () => {
  let service: OsServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OsServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
