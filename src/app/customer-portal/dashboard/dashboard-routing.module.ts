import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ListComponent } from '../lead/component/list/list.component';
import { ChatListComponent } from '../../agency-portal/components/chat/chat-list/chat-list.component';
import { ChatBoxComponent } from '../../agency-portal/components/chat/chat-box/chat-box.component';



const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      // { path: 'list', component: ListComponent },
       { path: 'list', component: ChatListComponent },
      { path: 'list/chat/chat-box/:id', component: ChatBoxComponent }
    ],
  },
];

  // { path: 'dash', component: DashboardComponent,
  //   children:[
  //   { path: '', redirectTo: 'chat', pathMatch: 'full' },
  //     { path: 'chat', component: ChatListComponent },
  //     { path: 'chat/chat-box/:id', component: ChatBoxComponent }
  //   ]
  //  },


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
