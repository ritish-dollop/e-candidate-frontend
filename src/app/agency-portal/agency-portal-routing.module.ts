import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuillModule } from 'ngx-quill';

import { AgencyDetailsComponent } from './components/agency/agency-details/agency-details.component';
import { AgencyListComponent } from './components/agency/agency-list/agency-list.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatBoxComponent } from './components/chat/chat-box/chat-box.component';
import { UserListComponent } from './components/user/user-list/user-list.component';
import { EmailFunctionalityComponent } from './components/email-functionality/email-functionality.component';
import { EmailContentComponent } from './components/email-functionality/email-content/EmailContentComponent';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AgencyComponent } from './components/agency/agency/agency.component';
import { ChatListComponent } from './components/chat/chat-list/chat-list.component';
import { CustomersComponent } from './components/customers/customers/customers/customers/customers.component';
import { LeadsComponent } from './components/campaigns/campaigns/campaigns/campaigns/leads/leads.component';
import { SingleLeadsComponent } from './components/campaigns/campaigns/campaigns/campaigns/single-leads/single-leads.component';
import { AddCustomersComponent } from './components/customers/customers/customers/customers/add-customers/add-customers.component';
import { CustomerCardComponent } from './components/customers/customers/customers/customers/customer-card/customer-card.component';
import { CampaignsComponent } from './components/campaigns/campaigns/campaigns/campaigns/campaigns.component';
import { ListCampaignsComponent } from './components/campaigns/campaigns/campaigns/campaigns/list-campaigns/list-campaigns.component';
import { AgencyTaskCalendarComponent } from './components/task-calendar/task-calendar.component';

const routes: Routes = [
  { path: '', redirectTo: 'dash', pathMatch: 'full' },

  // { path: 'agency', component: AgencyDetailsComponent },

  {
    path: 'agency',
    component: AgencyComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: AgencyListComponent },
      { path: 'details/:id', component: AgencyDetailsComponent },
    ],
  },

  {
    path: 'customer',
    component: CustomersComponent,
    children: [
      { path: '', redirectTo: 'card', pathMatch: 'full' },
      { path: 'card', component: CustomerCardComponent },
      { path: 'add', component: AddCustomersComponent }
    ]
  },

  {
    path: 'campaigns',
    component: CampaignsComponent,
    children: [

      { path: ':customerId', component: ListCampaignsComponent ,
        children:[
           { path: 'chat/chat-box/:id', component: ChatBoxComponent }

        ],
      },
      { path: 'leads/:campaignId', component: LeadsComponent },
      { path: 'single-lead-detail/:leadId', component: SingleLeadsComponent }


    ]
  },
  { path: 'user', component: UserListComponent },

  {
    path: 'dash', component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'chat', pathMatch: 'full' },
      { path: 'chat', component: ChatListComponent },
      { path: 'chat/chat-box/:id', component: ChatBoxComponent }
    ]
  },
  {
    path: 'email',
    component: EmailFunctionalityComponent,
    children: [
      { path: '', redirectTo: 'email-containt', pathMatch: 'full' },
      { path: 'email-containt', component: EmailContentComponent },
      { path: 'email-containt/:id', component: EmailContentComponent },
    ],
  },

  {
    path: 'chat',
    component: ChatComponent,
    children: [
      // { path: '', redirectTo: 'chat-box', pathMatch: 'full' },
      // { path: 'chat-box', component: ChatBoxComponent },
      { path: 'chat/chat-box/:id', component: ChatBoxComponent },
    ],
  },
  {
    path: 'task-calendar',
    component: AgencyTaskCalendarComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes), QuillModule.forRoot()],
  exports: [RouterModule],
})
export class AgencyPortalRoutingModule { }
