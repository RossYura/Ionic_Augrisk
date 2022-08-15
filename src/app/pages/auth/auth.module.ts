import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterComponent } from './register/register.component';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { StartedComponent } from './started/started.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { UserService } from 'src/app/core/services/user.service';
import { CognitoService } from 'src/app/core/services/cognito.service';
import { HttpClientModule } from '@angular/common/http';
import { FederatedLoginComponent } from './federated-login/federated-login.component';

/**
 * Make sure to update the shouldShowMenu() function on app.component.ts to exclude these
 */
const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: "",
        redirectTo: "started",
        pathMatch: "full"
      },
      {
        path: "register",
        component: RegisterComponent
      },
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "federated-login",
        component: FederatedLoginComponent
      },
      {
        path: "started",
        component: StartedComponent
      },
      {
        path: "forgot-password",
        component: ForgotPasswordComponent
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ],
  declarations: [AuthComponent, RegisterComponent, LoginComponent,FederatedLoginComponent, StartedComponent, ForgotPasswordComponent],
  providers: [UserService, CognitoService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthModule { }
