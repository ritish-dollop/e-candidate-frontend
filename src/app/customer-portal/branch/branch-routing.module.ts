import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchListComponent } from './component/branch-list/branch-list.component';
import { BranchUserComponent } from './component/branch-user/branch-user.component';

const routes: Routes = [
  { path: '', component: BranchListComponent },
  { path: ':id/users', component: BranchUserComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
