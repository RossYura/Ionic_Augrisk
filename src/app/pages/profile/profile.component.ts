import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { UserModel, UserPreferences } from 'src/app/core/models/user.model';
import { ToastController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { FormBuilder} from '@angular/forms';
import { Router } from '@angular/router';
import { MessageModel } from 'src/app/core/models/error-message.model';
import { CognitoService } from 'src/app/core/services/cognito.service';
import { Location } from '@angular/common';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, AfterViewInit {

  public isFacebook: boolean = false;
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public noticeMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
  public name: string = 'Loading...';
  public email: string = '';
  public notifications: 'all' | 'highThreats' | 'disabled';
  public emailNotifications: boolean = null;
  public darkMode: boolean;
  public userData$: BehaviorSubject<UserModel> = new BehaviorSubject(null);
  public userPreferences$: BehaviorSubject<UserPreferences> = new BehaviorSubject(null);
  public themeToggle: boolean = true;
  constructor(private userService: UserService, private toastController: ToastController, private ref: ChangeDetectorRef,
    public fb: FormBuilder, private router: Router, private cognitoService: CognitoService, private _location: Location) {
    const userData = this.userService.getUserData();
    this.userPreferences$ = this.userService.userPreferences$;
    const userPreferences = this.userPreferences$.value;
    this.userData$.next(userData);
    if (!environment.production) {
      console.log('user data is ', this.userData$.getValue());
      console.log('userPref is ', userPreferences);
    }
    this.name = userData.name;
    this.email = userData.email;
    this.emailNotifications = userData.optin;
    this.darkMode = userPreferences.darkMode;
    this.notifications = userPreferences.notifications;
  }

  ngOnInit(): void {

    /** start: Dark Theme Toggle */
    // document.body.classList.toggle('dark', this.darkMode);
    /** end: Dark Theme Toggle */

  }
  /** IMPORTNAT!! Must update DarkMode alongside other profile info into database */

  ngAfterViewInit(): void {
  }

  async submitForm() {
    try {
      if ((this.name === '' && this.isFacebook === false) || !this.email || this.email === '' || this.emailNotifications === null) {
        this.noticeMessage$.next({
          message: 'Please type in all the fields.',
          type: 'warning'
        });
        return false;
      } else {
        await this.saveProfile(this.name, this.emailNotifications, this.darkMode, this.notifications);
          this.presentToastWithOptions('Your profile was successfully updated.', 'top');
          if (!environment.production) console.log('Form submitted successfully.');
      }
      return;
    } catch (err) {
      throw err;
    }
  }

  // Called by check/uncheck the toggle
  checkDarkMode(event?: any) {
    this.loading$.next(true);
    const checked: boolean = event.detail.checked;
    this.darkMode = checked;
    document.body.classList.toggle('dark', this.darkMode);
    // Update User Data with chosen parameters to remember user choice
    let userPreferences = this.userPreferences$.getValue();
    userPreferences.darkMode = this.darkMode;
    if (!environment.production) console.log('user data mode after toggle is ', userPreferences.darkMode);
    this.userPreferences$.next(userPreferences);
    // this.userService.setUserPreferences(userPreferences);
    this.loading$.next(false);
  }

  async saveProfile(name: string, emailNotifications: boolean, darkMode: boolean, notifications?: 'all' | 'highThreats' | 'disabled'): Promise<void> {
    try {
      let userData = this.userData$.value;
      // Save user data
      const updatedUserData = await this.cognitoService.updateUser(userData.email, name, userData.phone, userData.address, userData.notifications, emailNotifications, userData.companyName);
      if (!environment.production) console.log('Updated user data is ', updatedUserData);
      // Save user preferences
      let userPreferences: UserPreferences = this.userPreferences$.value;
      userPreferences.notifications = notifications;
      await this.userService.setUserPreferences(userPreferences);
      await this.userService.updatePreferences({optin: emailNotifications}).toPromise();
      this.loading$.next(false);
      return;
    } catch (err) {
      this.loading$.next(false);
      throw err;
    }
  }



  // For showing confirmation messages
  async presentToastWithOptions(message: string, position?: 'top' | 'bottom' | 'middle', icon?: string, side?: 'start' | 'end') {
    icon = (icon) ? icon : 'checkmark';
    position = (position) ? position : 'bottom';
    side = (side) ? side : 'start';

    const toast = await this.toastController.create({
      // header: 'Toast header',
      message: message,
      duration: 2000,
      position: position,
      buttons: [
        {
          side: side,
          icon: icon,
          // text: 'Success',
          // handler: () => {}
        },
        // { text: 'Done', role: 'cancel',  handler: () => {}        }
      ]
    });
    toast.present();
  }

  goBack() {
		this._location.back();
	}

  logout(): void {
    this.router.navigate(['/pages/logout']);
  }


}
