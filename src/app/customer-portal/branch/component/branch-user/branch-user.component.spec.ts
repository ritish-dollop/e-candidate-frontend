import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchUserComponent } from './branch-user.component';

describe('BranchUserComponent', () => {
  let component: BranchUserComponent;
  let fixture: ComponentFixture<BranchUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
