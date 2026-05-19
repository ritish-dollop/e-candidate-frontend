import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeadsDetailsComponent } from './components/leads-details/leads-details.component';
import { SingleLeadDetailComponent } from './components/single-lead-detail/single-lead-detail.component';

import { CreateComponent } from '../lead/component/create/create.component';
import { ListCampaignsComponent } from './components/list-campaigns/list-campaigns.component';

const routes: Routes = [

  { path: '', redirectTo: 'customer', pathMatch: 'full' },
  { path: 'customer/:customerId', component: ListCampaignsComponent },
  { path: 'createLead', component: CreateComponent },

  { path: 'details/:campaignId', component: LeadsDetailsComponent},
  { path: 'single-lead-detail/:leadId', component: SingleLeadDetailComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class CampaignsRoutingModule { }
