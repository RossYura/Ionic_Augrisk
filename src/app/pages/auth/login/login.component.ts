import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController, AlertController } from '@ionic/angular';
import { CognitoService } from '../../../core/services/cognito.service';
import { environment } from '../../../../environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { MessageModel } from '../../../core/models/error-message.model';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  private loadingAlert_: HTMLIonLoadingElement;
  public loginForm: FormGroup;
  public confirmationForm: FormGroup;
  public unconfirmed$: Observable<boolean>;
  public notificationMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
  public userEmail$: Observable<string>;
  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute,
    private loadingController: LoadingController, private alertController: AlertController, private cognitoService: CognitoService) {
    this.unconfirmed$ = from(this.cognitoService.unconfirmed$);
    this.userEmail$ = this.cognitoService.userEmail$.asObservable();
    // this.userEmail = this.cognitoService.userEmail;
    // this.userPassword = this.cognitoService.userPassword;
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
    this.confirmationForm = this.fb.group({
      confirmationCode: ['', Validators.required]
    });

  }

  /**
   * Submitted by the Login form
   */
  async submitForm() {
    // Checking if no errors
    const currentControls = this.loginForm.controls;
    if (this.loginForm.invalid) {
      Object.keys(currentControls).forEach(controlName => {
        currentControls[controlName].markAsTouched()
        if (!environment.production) console.log(controlName + ' error: ', currentControls[controlName].errors);
      });
      return;
    }

    /** If no errors, proceed with login */
    // Initiate loading 
    this.loadingAlert_ = await this.loadingAlert();
    await this.loadingAlert_.present();

    // Update cognito credentials so they can be used during confirmation
    this.cognitoService.userEmail$.next(this.loginForm.controls["email"].value);
    this.cognitoService.userPassword$.next(this.loginForm.controls["password"].value);

    this.userLogin(this.loginForm.controls["email"].value, this.loginForm.controls["password"].value).then((res) => {
      // Stop Loading
      this.loadingAlert_.dismiss();
      if (res) {
        if (res.code === 'NetworkError') {
          this.showAlert('Connexion Error', 'Couldn\'t connect to the server.');
          this.notificationMessage$.next({
            message: 'Error: Couldn\'t connect to the server.',
            type: 'danger'
          });
          return;
        }
      }

      if (!environment.production) console.log('user login output:', res);
      // Might need to write user data somewhere?
      // Redirect to dashboard component
      this.router.navigate(['/pages/dashboard']);
      return;
    }, (err) => {
      this.loadingAlert_.dismiss();
      this.notificationMessage$.next({
        message: 'Error: ' + err.message,
        type: 'danger'
      });
      if (err.message) this.showAlert('Authentication Error', err.message);
    });
  }

  /**
   * Submitted by the Confirmation Code Form (after registration or login)
   */
  async submitConfirmationForm() {
    try {
      // Checking if no errors
      const currentControls = this.confirmationForm.controls;
      if (this.confirmationForm.invalid) {
        Object.keys(currentControls).forEach(controlName =>
          currentControls[controlName].markAsTouched()
        );
        return;
      }

      // Start loading 
      this.loadingAlert_ = await this.loadingAlert();
      await this.loadingAlert_.present();

      const userEmail = this.cognitoService.userEmail$.getValue();
      const userPassword = this.cognitoService.userPassword$.getValue();
      // if (!environment.production) console.log('Attempting confirmation with credentails: ' + userEmail + ' and ' + userPassword);

      const res = await this.cognitoService.confirmRegistration(userEmail, this.confirmationForm.controls.confirmationCode.value);
      if (!environment.production) console.log('Account has been successfully been confirmed.', JSON.stringify(res));
      this.notificationMessage$.next({
        message: 'Success. You will be logged-in in a few seconds...',
        type: 'success'
      });
      const login = await this.userLogin(userEmail, userPassword);
      await this.loadingAlert_.dismiss();
      this.router.navigate(['/pages/dashboard']);
      return login;
    } catch (error) {
      await this.loadingAlert_.dismiss();
      this.notificationMessage$.next({
        message: 'Confirmation Error: ' + error.message,
        type: 'danger'
      })
      throw error;
    }
  }

  /**
   * Submitted through the Account Confirmation form, resends a new confirmation code 
   */
  async resendConfirmationCode(): Promise<void> {
    console.log('sending confirmation code...');
    this.loadingAlert_ = await this.loadingAlert();
    await this.loadingAlert_.present();
    const userEmail = this.cognitoService.userEmail$.getValue();
    if (!userEmail) {
      this.notificationMessage$.next({
        message: 'Unexpected error while attempting to send the confirmation code.',
        type: 'danger'
      });
    }
    // First, logging-in and retrieving CognitoUser
    this.cognitoService.returnCognitoUser(userEmail)
      .then((cognitoActiveUser) => {
        // if (!environment.production) console.log('Cognito Active user is ', cognitoActiveUser);

        // Attempting to resend the code by email
        this.cognitoService.resendCode(cognitoActiveUser)
          .then(async (res) => {
            await this.loadingAlert_.dismiss();
            if (!environment.production) console.log('Code resent successfully to ' + userEmail, res);
            await this.showAlert('New Code', 'A new code was successfully sent to your email address (' + userEmail + ').');
          }, (err) => {
            this.loadingAlert_.dismiss();
            console.log('Error during resend code submission', err);
            this.notificationMessage$.next({
              message: 'An error occurred: ' + err.message,
              type: 'danger'
            });
            this.showAlert('Error', err.message);
          });

      }, (err) => console.log('Error during login attempt: ', err));
  }

  async loadingAlert() {
    return await this.loadingController.create({
      message: 'Please wait...',
      duration: 2000,
      // translucent: true,
      spinner: 'crescent',
      backdropDismiss: false,
      animated: true,
      keyboardClose: true
    });
    // await alert.present();
  }

  async showAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      // subheader: 'Subtitle',
      message: message,
      buttons: ['OK']
    });
    alert.present();
  }

  controlHasError(formGroup: FormGroup, controlName: string, validationType: string): boolean {
    const control = formGroup.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }

  /**
   * Logging into Cognito
   * @param username: string => User username
   * @param password: string => User password
   * returns :  { userData: UserModel, cognitoUser: cognitoUser }
   */
  async userLogin(username: string, password: string) {
    // Set scope of Sentry to give context of user email to the errors reported
    // Sentry.configureScope((scope) => {
    // scope.setUser({ "email": username });
    //});
    try {
      const res = await this.cognitoService.cognitoLogin(username, password);
      if (res.status == 'newPasswordRequired') {
        //  This means the user needs a new password because it was generated with adminCreateUser			
        // For now, we won't be implementing this here. Just sending them to the website
        this.showAlert('User must change password',
          'Your user was generated by an administrator. Please go to app.augurisk.com to change your password on your first login to complete your registration.');
        /*
        When we want to implement user confirmation in the app, we'll need these two variables
        // this.cognitoUser = res.cognitoUser;
        // this.userAttr = res.userAttr;
        */
        return;
      }
      // Login was successful
      return res;
    } catch (err) {
      if (err.message === "User is not confirmed.") {
        this.cognitoService.unconfirmed$.next(true);
        return;
      }
      throw (err);
    }
  }
  
  /** Redirection for Login with Facebook button */
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
