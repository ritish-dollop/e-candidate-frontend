import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { NewPasswordComponent } from './new-password/new-password.component';

const routes: Routes = [
{path: '', redirectTo:'login' ,pathMatch:'full'},
{path: 'forgot_password', component: ForgotPasswordComponent },
{ path: 'login', component: LoginComponent },
{path : 'new_password' , component:NewPasswordComponent},
{path:'verify', component:VerifyOtpComponent}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
