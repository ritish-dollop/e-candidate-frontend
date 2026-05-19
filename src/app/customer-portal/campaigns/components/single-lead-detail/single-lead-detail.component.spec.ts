import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleLeadDetailComponent } from './single-lead-detail.component';

describe('SingleLeadDetailComponent', () => {
  let component: SingleLeadDetailComponent;
  let fixture: ComponentFixture<SingleLeadDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleLeadDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleLeadDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
