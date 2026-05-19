import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AgencyPortalRoutingModule } from './agency-portal-routing.module';
import { AgencyDetailsComponent } from './components/agency/agency-details/agency-details.component';
import { AgencyListComponent } from './components/agency/agency-list/agency-list.component';
import { ChatBoxComponent } from './components/chat/chat-box/chat-box.component';
import { ChatComponent } from './components/chat/chat.component';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { EmailListComponent } from './components/email-functionality/email-list/email-list.component';
@NgModule({
  imports: [
    CommonModule,
    AgencyPortalRoutingModule,
    AgencyDetailsComponent,
    ChatComponent,
    FormsModule,
    EmailListComponent  ]
})
export class AgencyPortalModule { }
// import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClientModule } from '@angular/common/http';
// import { AgencyPortalRoutingModule } from './agency-portal-routing.module';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// // Components
// import { AgencyDetailsComponent } from './components/agency/agency-details/agency-details.component';
// import { AgencyListComponent } from './components/agency/agency-list/agency-list.component';
// import { ChatBoxComponent } from './components/chat/chat-box/chat-box.component';
// import { ChatComponent } from './components/chat/chat.component';
// import { EmailListComponent } from './components/email-functionality/email-list/email-list.component';

// @NgModule({
//   imports: [
//     CommonModule,
//     HttpClientModule,
//     AgencyPortalRoutingModule,
//     FormsModule,
//     ReactiveFormsModule,
//     AgencyDetailsComponent,
//     AgencyListComponent,
//     ChatBoxComponent,
//     ChatComponent,
//     EmailListComponent,
//   ],
// })
// export class AgencyPortalModule {}
