import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadsDetailsComponent } from './leads-details.component';

describe('LeadsDetailsComponent', () => {
  let component: LeadsDetailsComponent;
  let fixture: ComponentFixture<LeadsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
