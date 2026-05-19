import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './component/chat/chat.component';
import { ChatBoxComponent } from '../../agency-portal/components/chat/chat-box/chat-box.component';

const routes: Routes = [
  {
        path : '', redirectTo: 'chat', pathMatch: 'full'
      },
      {
        path: 'chat',component: ChatComponent,
          children: [
              { path: '', redirectTo: 'list', pathMatch: 'full' },
              // { path: 'list', component: ListComponent },
              //  { path: 'list', component: ChatListComponent },
              { path: 'chat/chat-box/:id', component: ChatBoxComponent }
            ],
      }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgencyroomRoutingModule { }
