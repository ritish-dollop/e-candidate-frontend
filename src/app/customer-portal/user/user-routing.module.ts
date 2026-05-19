import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerUserComponent } from './component/customer-user/customer-user.component';

const routes: Routes = [
  {
    path: '', redirectTo: 'all', pathMatch: 'full'
  },
  {
    path: 'all', component: CustomerUserComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
