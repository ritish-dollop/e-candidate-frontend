import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyTaskCalendarComponent } from './task-calendar.component';

describe('AgencyTaskCalendarComponent', () => {
  let component: AgencyTaskCalendarComponent;
  let fixture: ComponentFixture<AgencyTaskCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyTaskCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgencyTaskCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

