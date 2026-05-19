import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from '../../agency-portal/components/chat/chat.component';
import { ChatBoxComponent } from '../../agency-portal/components/chat/chat-box/chat-box.component';
import { EmailFunctionalityComponent } from '../../agency-portal/components/email-functionality/email-functionality.component';
import { EmailContentComponent } from '../../agency-portal/components/email-functionality/email-content/EmailContentComponent';


const routes: Routes = [
    {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'campaign',
        loadChildren: () =>
          import('../campaigns/campaigns.module').then(
            (m) => m.CampaignsModule
          ),
      },
      {
        path: 'taskcalender',
        loadChildren: () =>
          import('../task-calender/task-calender.module').then(
            (m) => m.TaskCalenderModule
          ),
      },
      {
        path: 'branches',
        loadChildren: () =>
          import('../branch/branch.module').then((m) => m.BranchModule),
      },
      {
        path: 'user',
        loadChildren: () =>
          import('../user/user.module').then((m) => m.UserModule),
      },
     {
       path: 'chat',
       component: ChatComponent,
       children: [
        //  { path: '', redirectTo: 'chat-box', pathMatch: 'full' },
        //  { path: 'chat-box', component: ChatBoxComponent },
         { path: 'chat/chat-box/:id', component: ChatBoxComponent },
       ]
     },
       {
         path: 'email',
         component: EmailFunctionalityComponent,
         children: [
           { path: '', redirectTo: 'email-containt', pathMatch: 'full' },
           { path: 'email-containt', component: EmailContentComponent },
           { path: 'email-containt/:id', component: EmailContentComponent },
         ]
       },
       {
         path: 'agencyroom',
         loadChildren: () =>
           import('../agencyroom/agencyroom.module').then((m) => m.AgencyroomModule),
       }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class HomeRoutingModule {}
