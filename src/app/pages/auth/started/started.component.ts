import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'started',
  templateUrl: './started.component.html',
  styleUrls: ['./started.component.scss'],
})
export class StartedComponent implements OnInit {
  // Detailed options here https://swiperjs.com/api/
  public slideOpts = {
    initialSlide: 1,
    speed: 400,
    autoplay: true
  };
  public darkMode: boolean;
  constructor(private router: Router, private userService: UserService) {
    this.darkMode = this.userService.getUserPreferences().darkMode;
   }

  ngOnInit() {}

  redirectToSignup(): void {
    this.router.navigate(['auth/register']);
  }

  loginWithFacebook(): void {
    const baseUrl = environment.cognitoConf.clientBaseUrl;
    const redirectUrl = environment.cognitoConf.clientRedirectUrl;
    const clientId = environment.cognitoConf.cognito.cognitoClientPoolId;
    const scopes = 'aws.cognito.signin.user.admin+email+openid+phone';
    //var url = baseUrl + 'login?client_id=' + clientId + '&response_type=code&scope=' + scopes + '&redirect_uri=' +  redirectUrl;

    var url =  `${baseUrl}oauth2/authorize` +
    `?identity_provider=Facebook` +
    `&redirect_uri=${redirectUrl}` +
    `&response_type=code` +
    `&client_id=${clientId}` +
    `&scope=${scopes}`;
    //console.log('url is : ', url);
    
    window.location.href=url;
  }

}
