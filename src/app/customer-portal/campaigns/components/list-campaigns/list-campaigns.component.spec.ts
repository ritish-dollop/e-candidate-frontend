import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCampaignsComponent } from './list-campaigns.component';

describe('ListCampaignsComponent', () => {
  let component: ListCampaignsComponent;
  let fixture: ComponentFixture<ListCampaignsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCampaignsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCampaignsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
