import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, CanLoad, Route, Router, CanActivateChild } from '@angular/router';
import { CognitoService } from '../services/cognito.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class IsLoggedInGuard implements CanActivate, CanLoad, CanActivateChild {

  constructor(private cognitoService: CognitoService, private router: Router, private userService: UserService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (!environment.production) console.log('CanActivate Guard in effect.');
    return new Promise((resolve, reject) => {
      this.checkSession()
        .then((res) => resolve(true),
          (err) => reject(false));
    });
  }

  canLoad(route: Route): Promise<boolean> {
    if (!environment.production) console.log('CanLoad Guard is in effect');
    return new Promise((resolve, reject) => {
      this.checkSession()
        .then((res) => resolve(true),
          (err) => reject(false));  
    });
  }
  
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (!environment.production) console.log('CanActivateChild is in effect');
    return new Promise((resolve, reject) => {
      this.checkSession()
        .then((res) => resolve(true),
          (err) => reject(false));
    });
  }

  /* Function for checking if user is logged in
    * checks if user is loggedin, also checks if token expires soon, then renews it,
    * if not logged in, returns 'not_logged_in'
    */
  checkSession(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isGuardCheckInProgress()) {
        resolve(true);
      }
      this.startGuardCheck();
      this.cognitoService.checkSessionAndRenew()
        .then((res) => {
          if (!environment.production) console.log('Guard Session Check successful');
          this.endGuardCheck();
          resolve(true);
        }, (err) => {
          // If user not logged in, redirect him to Login page
          if (!environment.production) console.log('Error during Guard Session check: ', err);
          this.endGuardCheck();
          this.router.navigate(['auth/started']);
          reject(false);
        });
    });
  }

  /** These are supposed to prevent multiple guards changing tokens simultaneously */
  isGuardCheckInProgress(): boolean {
    const guardCheck = (this.userService.guardCheckInProgress$.getValue()) ? this.userService.guardCheckInProgress$.getValue() : false;
    return guardCheck;
  }

  startGuardCheck(): void {
    this.userService.guardCheckInProgress$.next(true);
  }

  endGuardCheck(): void {
    this.userService.guardCheckInProgress$.next(false);
  }


}
