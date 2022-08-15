import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { MessageModel } from 'src/app/core/models/error-message.model';
import { environment } from 'src/environments/environment';
import { LoadingController, AlertController } from '@ionic/angular';
import { ContactService } from 'src/app/core/services/contact.service';
import { Location } from '@angular/common';

@Component({
  selector: 'contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {

  private loadingAlert_: HTMLIonLoadingElement;
  public contactForm: FormGroup;
  public notificationMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
  constructor(private fb: FormBuilder, private loadingController: LoadingController,
    private alertController: AlertController, private contactService: ContactService, private _location: Location) { }

  ngOnInit() {
    this.contactForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  
  goBack() {
		this._location.back();
	}

  /**
   * Submitted by the Contact form
   */
  async submitForm() {
    try {
      // Checking if no errors
      const currentControls = this.contactForm.controls;
      if (this.contactForm.invalid) {
        Object.keys(currentControls).forEach(controlName => {
          currentControls[controlName].markAsTouched()
          if (!environment.production) console.log(controlName + ' error: ', currentControls[controlName].errors);
        });
        return;
      }

      /** If no errors, send contact message */
      // Initiate loading 
      this.loadingAlert_ = await this.loadingAlert();
      await this.loadingAlert_.present();

      await this.sendMessage();

      await this.loadingAlert_.dismiss();

      await this.showAlert('Message Sent', 'Thanks for your message!');

    } catch (err) {
      // alert message
      throw (err);
    }
  }

  sendMessage(): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = this.contactForm.controls['message'].value
      if (!message) reject(new Error('Message is empty!'));

      // send message
      this.contactService.sendMail(message).subscribe((res) => {
        if (!environment.production) console.log('Message was sent successfully:', message);
        resolve(res);
      }, (err) => {
        reject(err);
      });
    });

  }

  async loadingAlert(): Promise<HTMLIonLoadingElement> {
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

  async showAlert(title: string, message: string): Promise<HTMLIonAlertElement> {
    const alert = await this.alertController.create({
      header: title,
      // subheader: 'Subtitle',
      message: message,
      buttons: ['OK']
    });
    alert.present();
    return alert;
  }

  /** Checks if controls have errors in the HTML */
  controlHasError(formGroup: FormGroup, controlName: string, validationType: string): boolean {
    const control = formGroup.controls[controlName];
    if (!control) {
      return false;
    }
    const result = control.hasError(validationType) && (control.dirty || control.touched);
    return result;
  }

}
