import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleLeadsComponent } from './single-leads.component';

describe('SingleLeadsComponent', () => {
  let component: SingleLeadsComponent;
  let fixture: ComponentFixture<SingleLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleLeadsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
