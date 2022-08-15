import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { MessageModel } from 'src/app/core/models/error-message.model';
import { environment } from 'src/environments/environment';
import { CognitoService } from 'src/app/core/services/cognito.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {

  // Verify tells us when to show 2nd verificationCode form
  public verify$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private loadingAlert_: HTMLIonLoadingElement;
  public forgotForm: FormGroup;
  public changePasswordForm: FormGroup;
  public notificationMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
  constructor(private fb: FormBuilder, private cognitoService: CognitoService,
    private alertController: AlertController, private loadingController: LoadingController,
    private router: Router) { }

  ngOnInit() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.changePasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      verificationCode: ['', Validators.required]
    });
  }

  /**
   * First step, submitted with the user email to send a reset password code
   */
  async submitForgotForm() {
    try {
      // Checking if no errors
      const currentControls = this.forgotForm.controls;
      if (this.forgotForm.invalid) {
        Object.keys(currentControls).forEach(controlName => {
          currentControls[controlName].markAsTouched()
          if (!environment.production) console.log(controlName + ' error: ', currentControls[controlName].errors);
        });
        return;
      }

      const controls = this.forgotForm.controls;
      const email = controls['email'].value;
      this.cognitoForgotPassword(email);

    } catch (err) {
      throw (err);
    }
  }

  /**
   * Last step, once the code has been read, this form uses the code to reset a new password
   */
  async submitResetForm() {
    try {
      // Checking if no errors
      const currentControls = this.changePasswordForm.controls;
      if (this.changePasswordForm.invalid) {
        Object.keys(currentControls).forEach(controlName => {
          currentControls[controlName].markAsTouched()
          if (!environment.production) console.log(controlName + ' error: ', currentControls[controlName].errors);
        });
        return;
      }
    } catch (err) {
      throw (err);
    }
  }

  /** First step, sends verification code to email address */
  async cognitoForgotPassword(email: string) {
    try {
      // Checking forgot Password Form for errors
      const controls = this.forgotForm.controls;
      if (this.forgotForm.invalid) {
        Object.keys(controls).forEach(controlName =>
          controls[controlName].markAsTouched()
        );
        const message: MessageModel = {
          message: 'Please fill in your email address.',
          type: 'info'
        };
        this.notificationMessage$.next(message);
        return;
      } else {
        this.loadingAlert_ = await this.loadingAlert();
        await this.loadingAlert_.present();

        // Requesting a new password code to be sent by Cognito
        const res = await this.cognitoService.forgotPassword(email)
        console.log('Forgot password request successful: ', res);
        const message: MessageModel = {
          message: 'The verification code has been sent to your email address, at ' + email,
          type: 'success'
        };
        this.notificationMessage$.next(message);
        this.verify$.next(true);
        await this.loadingAlert_.dismiss();
      }
    } catch (err) {
      if (err.message == 'User password cannot be reset in the current state.') {
        await this.loadingAlert_.dismiss();
        // This error means the user has been created from the user management panel. We'll send him to the site
        const errorMessage = 'Your account was created by an administrator. Please go to app.augurisk.com to reset your password.';
        this.notificationMessage$.next({
          message: errorMessage,
          type: 'warning'
        });
        return;
      } else {
        console.error('Error during forgot password request:  ', err.message || JSON.stringify(err));
        const message: MessageModel = {
          message: 'An error occurred: ' + err.message,
          type: 'danger'
        };
        this.notificationMessage$.next(message);
        await this.loadingAlert_.dismiss();
      }
      throw (err);
    }
  }

  /** Last step, changes the password */
  async cognitoChangePassword() {
    try {
      // Checking forgot Password Form for errors
      const controls = this.changePasswordForm.controls;
      if (this.changePasswordForm.invalid) {
        Object.keys(controls).forEach(controlName =>
          controls[controlName].markAsTouched()
        );
        const message: MessageModel = {
          message: 'Please fill in all the fields.',
          type: 'info'
        };
        this.notificationMessage$.next(message);
        return;
      } else {
        // email from first form and three other variables from the second form
        const email = this.forgotForm.controls.email.value;
        const verificationCode = this.changePasswordForm.controls.verificationCode.value;
        const newPassword = this.changePasswordForm.controls.password.value;
        const confirmPassword = this.changePasswordForm.controls.confirmPassword.value;

        // Shouldn't happen, as already checked by the custom password validator
        // Should probably remove this at some point
        if (newPassword !== confirmPassword) {
          const message: MessageModel = {
            message: 'Your password doesn\'t match with the Password Confirmation.',
            type: 'info'
          };
          this.notificationMessage$.next(message);
          return;
        }

        this.loadingAlert_ = await this.loadingAlert();
        await this.loadingAlert_.present();

        // Proceed to changing the password with the verification code
        const res = await this.cognitoService.forgotPasswordChange(email, verificationCode, newPassword);

        console.log('Successfully changed password for ' + email);
        const message: MessageModel = {
          message: 'Password successfully changed. Redirecting to login..',
          type: 'success'
        };
        this.notificationMessage$.next(message);
        await this.loadingAlert_.dismiss();
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
        // Redirect the user after three seconds
      }
    } catch (err) {
      console.log('Error while trying to change password: ' + err.message || err);
      const message: MessageModel = {
        message: 'An error has occurred: ' + err.message || 'Unspecified error ',
        type: 'danger'
      };
      this.notificationMessage$.next(message);
      await this.loadingAlert_.dismiss();
      throw (err);
    }
  }

  /**
   * Used in the HTMLL to show errors if controls have them 
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

  /**
   * Shows loading modal
   * Must use with async methods .present() and .dismiss()
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
    // await alert.present();
  }

  /**
   * Shows custom message modal
   * Must use with async methods .present() and .dismiss()
   */
  async showAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      // subheader: 'Subtitle',
      message: message,
      buttons: ['OK']
    });
    alert.present();
  }


}
