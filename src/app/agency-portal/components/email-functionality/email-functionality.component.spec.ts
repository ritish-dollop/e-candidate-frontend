import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailFunctionalityComponent } from './email-functionality.component';

describe('EmailFunctionalityComponent', () => {
  let component: EmailFunctionalityComponent;
  let fixture: ComponentFixture<EmailFunctionalityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmailFunctionalityComponent]
    });
    fixture = TestBed.createComponent(EmailFunctionalityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
