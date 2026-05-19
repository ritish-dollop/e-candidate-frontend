import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerRoomComponent } from './customer-room.component';

describe('CustomerRoomComponent', () => {
  let component: CustomerRoomComponent;
  let fixture: ComponentFixture<CustomerRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
