import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './core/services/user.service';
import { UserPreferences } from './core/models/user.model';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public userPreferences$: BehaviorSubject<UserPreferences>;
  public selectedIndex = 0;
  public appPages = [
    {
      title: 'Dashboard',
      url: '/pages/dashboard',
      icon: 'home'
    },
    {
      title: 'Crime Report',
      url: '/pages/crime-report',
      icon: 'reader'
    },
    {
      title: 'Coronavirus Report',
      url: '/pages/coronavirus',
      icon: 'stats-chart'
    },
    {
      title: 'News',
      url: '/pages/blog-posts',
      icon: 'newspaper'
    },
    {
      title: 'Risk Assessment',
      url: '/pages/risk-assessment',
      icon: 'checkmark-done-circle'
    },
    {
      title: 'Emergency Numbers',
      url: '/pages/emergency-numbers',
      icon: 'call'
    },
    {
      title: 'Contact',
      url: '/pages/contact',
      icon: 'mail'
    },
    {
      title: 'Profile',
      url: '/pages/profile',
      icon: 'person-circle'
    },/*
    {
      title: 'Legal',
      url: '/pages/legal',
      icon: 'document-text'
    },*/
    {
      title: 'Logout',
      url: '/pages/logout',
      icon: 'log-out'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.initializeApp();
    if (this.userService.getUserData()) {
      const userPreferences = this.userService.getUserPreferences();
      if (!environment.production) console.log('dark mode is ', userPreferences.darkMode);
      this.userPreferences$ = new BehaviorSubject(userPreferences);
    }
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  /**
   * Hides menu for auth pages. Returns false if router URL is one of the auth children components
   */
  shouldShowMenu(): boolean {
    // current URL, ex: /auth/register
    const url = this.route['_routerState'].snapshot.url;
    const hideFor = ['/auth/register', '/auth/started', '/auth/login', '/auth/forgot-password', '/auth/federated-login'];
    // If url contains hideFor, hide menu 
    if (hideFor.indexOf(url) > -1) {
      return false;
    } else {
      return true;
    }
  }

  ngOnInit(): void {
    this.checkIfUserDarkMode();
  }

  checkIfUserDarkMode(): void {
    if (this.userPreferences$) {
      const darkMode = (this.userPreferences$.getValue()) ? Boolean(this.userPreferences$.getValue().darkMode) : false;
      if (!environment.production) console.log('Checking if dark mode: ', darkMode);
      document.body.classList.toggle('dark', darkMode);
    }
  }

}
