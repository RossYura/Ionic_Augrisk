import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, CanLoad, Route, Router } from '@angular/router';
import { CognitoService } from '../services/cognito.service';
import { environment } from '../../../environments/environment';

/**
 * This guard allows us to make sure the user is already logged out before attempting to sign
 * into another account. If not, redirect to Overview page
 */
@Injectable({
  providedIn: 'root'
})
export class IsLoggedOutGuard implements CanActivate {

  constructor(private cognitoService: CognitoService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {

      this.cognitoService.checkSessionAndRenew()
        .then((res) => {
          // If user already logged in in Auth page, redirect him to dashboard
          if (!environment.production) console.log('Logged out guard unsuccessful.');
          this.router.navigate(['/pages/']);
          reject(false);
        }, (err) => {
          if (!environment.production) console.log('Logged out guard Check successful');
          resolve(true);
        });

    });
  }

}
