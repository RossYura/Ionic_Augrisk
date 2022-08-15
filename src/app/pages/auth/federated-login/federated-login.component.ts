import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CognitoService, CognitoFederatedIdentity } from 'src/app/core/services/cognito.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'federated-login',
  templateUrl: './federated-login.component.html',
})
export class FederatedLoginComponent implements OnInit {

  public code: string;
  public sessionData: CognitoFederatedIdentity;

  constructor(private route: ActivatedRoute, private cognitoService: CognitoService,
    private router: Router, private userService: UserService) { 
        // In case user used the Facebook Login Button, extract the id_token from it
        this.route.queryParams.subscribe( (res) => {
            /**
             * id_token: string
             * expires_in: number (3600)
             * token_type: 'Bearer' | '?'
             */
            if (!environment.production) {
              console.log('FB Params are: ', JSON.stringify(res));
            }
            if (res.code) this.code = res.code;
          });


  }

  ngOnInit() {
    if (this.code) {
      this.cognitoService.exchangeAuthorizationCode(this.code).subscribe( async (res) => {
        try {
        this.sessionData = res;
        if (!environment.production) console.log('FB Session data: ', res);
        // Update user data and redirect to dashboard to complete login
        let userData = await this.userService.getUserData();
        userData = {
          ...res
        }
        if (!environment.production) console.log('user data is', userData);
        await this.userService.setUserData(res);
        await this.cognitoService.loginWithSession(res);
        this.router.navigate(['/pages/dashboard']);
        } catch (err) {
          throw err;
        }
      }, (err) => {
        throw err;
      })
    }
  }

}
