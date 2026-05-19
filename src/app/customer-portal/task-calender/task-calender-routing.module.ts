import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskCalenderComponent } from './component/task-calender/task-calender.component';

const routes: Routes = [
  {
      path : '', redirectTo: 'all', pathMatch: 'full'
    },
    {
      path: 'all',component: TaskCalenderComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaskCalenderRoutingModule { }
