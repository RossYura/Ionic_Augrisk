import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmPasswordValidator } from '../../../core/validators/confirm-password.validator';
import { PasswordStrengthValidator } from '../../../core/validators/password-strength.validator';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CognitoService } from '../../../core/services/cognito.service';

@Component({
  selector: 'register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {

  private utm_source: string;
  private utm_medium: string;
  private utm_campaign: string;
  public registerForm: FormGroup;
  private loadingAlert_: HTMLIonLoadingElement;
  constructor(private fb: FormBuilder, private route: ActivatedRoute, private cognitoService: CognitoService,
    private loadingController: LoadingController, private alertController: AlertController, private router: Router) {
    // read snapshot of URL to specify utm_source, utm_medium, utm_campaign
    this.utm_source = '';
    this.utm_medium = '';
    this.utm_campaign = '';
  }

  ngOnInit() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      confirmPassword: ['', Validators.required],
      terms: [null, Validators.required],
      optin: [null, Validators.nullValidator]
    }, {
      validators: [ConfirmPasswordValidator.MatchPassword, PasswordStrengthValidator.PasswordStrength]
    })
  }
  // The PasswordStrength validator is not working properly. Must make it comply with Cognito Policy (6 characters letters and numbers)

  async submitForm() {
    let errorDetected;
    // Checking if no errors
    const currentControls = this.registerForm.controls;
    if (this.registerForm.invalid) {
      Object.keys(currentControls).forEach(controlName => {
        currentControls[controlName].markAsTouched();
        if (!environment.production) console.log(controlName + ' error: ', currentControls[controlName].errors);
      });
      errorDetected = true;
      return;
    }

    // Start loading 

    this.loadingAlert_ = await this.loadingAlert();
    await this.loadingAlert_.present();

    // Alert in case of error 
    if (errorDetected) {
      // If any field is missing
      this.showAlert('Missing Fields', "Please fill in all the fields and agree to our terms of service and privacy policy.");
    } else {
      // Initiating signup process...
      const registrationName = this.registerForm.controls.name.value;
      const registrationEmail = this.registerForm.controls.email
        .value;
      const registrationPassword = this.registerForm.controls.password
        .value;

      const optin = this.registerForm.controls.optin.value;

      this.registerUser(registrationEmail, registrationPassword, registrationName,
        optin, this.utm_source, this.utm_medium, this.utm_campaign);
    }
    console.log(this.registerForm.value);

    setTimeout(() => {
      this.loadingAlert_.dismiss();
    }, 2000);
  }

  /**
   * Shows a loading modal
   */
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
    // must type await alert.present(); to show it and .dismiss() to close it.
  }

  /**
   * Shows a custom modal to the user
   * @param title 
   * @param message 
   */
  async showAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      // subheader: 'Subtitle',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Checks if any field of the form has an error. Used in the HTML to show errors.
   * @param formGroup 
   * @param controlName 
   * @param validationType 
   */
  controlHasError(formGroup: FormGroup, controlName: string, validationType: string): boolean {
    const control = formGroup.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }

  async registerUser(registrationEmail: string, registrationPassword: string, registrationName: string,
    optin: boolean, utm_source: string, utm_medium: string, utm_campaign: string) {
    try {
      if (!registrationEmail || !registrationPassword || !registrationName) {
        console.error("Error:  Missing fields.");
        this.showAlert('Missing Fields', 'You need to fill in all the fields, and agree to our terms.');
        return;
      } else {
        this.loadingAlert_ = await this.loadingAlert();
        await this.loadingAlert_.present();
        /*setTimeout( () => {
          this.loadingAlert_.dismiss();
        }, 2500);*/
        const registerUser = await this.cognitoService.registerUser(registrationEmail, registrationPassword,
          registrationName, optin, utm_source, utm_medium, utm_campaign);
        await this.loadingAlert_.dismiss();
        console.log('Registration successful! Redirecting to confirmation page...');
        this.cognitoService.unconfirmed$.next(true);
        this.cognitoService.userEmail$.next(registrationEmail);
        this.cognitoService.userPassword$.next(registrationPassword);
        this.router.navigate(['/auth/login']);
        // const from_utm_source = utm_source ? utm_source : 'unknown_source';
        // this.analyticsEmitEvent('sign_up', 'sign_up', 'sign_up_from_' + from_utm_source);
        return true;
      }
    } catch (err) {
      this.loadingAlert_.dismiss();
      this.showAlert('Error', err.message);
      throw (err);
    }

  }

}
