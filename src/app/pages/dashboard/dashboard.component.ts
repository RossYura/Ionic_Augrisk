import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

import { Plugins, LocalNotificationScheduleResult } from '@capacitor/core';
const { LocalNotifications, BackgroundRiskdataPlugin } = Plugins;
import { BackgroundRiskdataPluginPlugin } from 'background-riskdata-plugin';
const BgRiskUpdate = BackgroundRiskdataPlugin as BackgroundRiskdataPluginPlugin;

import { ActionSheetController, ModalController, IonRouterOutlet } from '@ionic/angular';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { TrackerService, PositionModel } from 'src/app/core/services/tracker.service';
import { RiskService } from 'src/app/core/services/risk.service';
import { environment } from 'src/environments/environment';
import { RiskModel } from 'src/app/core/models/risk.model';
import { MessageModel } from 'src/app/core/models/error-message.model';
import { Router } from '@angular/router';
import { CognitoService } from 'src/app/core/services/cognito.service';

// Risk Detail Modals
import { AirPollutionDetailsComponent } from '../modals/air-pollution-details/air-pollution-details.component';
import { CrimeDetailsComponent } from '../modals/crime-details/crime-details.component';
import { StormDetailsComponent } from '../modals/storm-details/storm-details.component';
import { WildfireDetailsComponent } from '../modals/wildfire-details/wildfire-details.component';
import { FloodDetailsComponent } from '../modals/flood-details/flood-details.component';
import { EarthquakeDetailsComponent } from '../modals/earthquake-details/earthquake-details.component';
import { NuclearDetailsComponent } from '../modals/nuclear-details/nuclear-details.component';

// iconColor: 'success' | 'warning' | 'danger' | 'info';

export interface SummaryMessagesModel {
  globalTitle: string;
  globalText: string;
  globalIcon: string;
  alertTitle: string;
  alertText: string;
  alertIcon: string;
  crimeText: string;
  crimeIcon: string;
  crimeColor?: string;
  airPollutionText: string;
  airPollutionIcon: string;
  stormsText: string;
  stormsIcon: string;
  wildfiresText: string;
  wildfiresIcon: string;
  floodText: string;
  floodIcon: string;
  earthquakesText: string;
  earthquakesIcon: string;
  nuclearText: string;
  nuclearIcon: string;
}

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  public subscriptions: Subscription[] = [];
  public loading: boolean;
  public riskData$: BehaviorSubject<RiskModel> = new BehaviorSubject(null);
  public currentLocation$: BehaviorSubject<PositionModel> = new BehaviorSubject(null);
  public previousLocation$: BehaviorSubject<PositionModel> = new BehaviorSubject(null);
  public noticeMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
  public lastUpdateTime: number;
  private riskConnexionRetries = 0;
  private notifs: LocalNotificationScheduleResult;

  /** User Preferences */
  // What notifications show to user?
  public notifications: 'all' | 'highThreats' | 'disabled';
  // What assessments are active?
  public isCrimeActive: boolean;
  public isEarthquakeActive: boolean;
  public isStormActive: boolean;
  public isCoastalFloodActive: boolean;
  public isNuclearActive: boolean;
  public isWildfireActive: boolean;
  public isAirPollutionActive: boolean;
  public darkMode: boolean;
  // Is it disabled?
  public disabled: boolean;
  public summaryMessages$: BehaviorSubject<SummaryMessagesModel> = new BehaviorSubject(null);

  // Helper variables: whether to show "all risks active" or "All risks deactivated" messages
  public allTogglesActivated: boolean;
  public allTogglesDeactivated: boolean;

  // Mapbox details
  public mapBox: mapboxgl.Map;
  private style: string = 'light-v10';
  private zoom: number = 17;

  constructor(private userService: UserService, private actionSheetController: ActionSheetController,
    private trackerService: TrackerService, private riskService: RiskService, private router: Router, private cognitoService: CognitoService,
    private modalController: ModalController, private routerOutlet: IonRouterOutlet) {

    (mapboxgl as any).accessToken = environment.mapbox.accessToken;

    this.style = (this.userService.getUserPreferences().darkMode) ? 'dark-v10' : 'light-v10';

    /** Checking user and initiating preferences */
    this.subscriptions.push(
      this.userService.userPreferences$.subscribe((res) => {
        this.isCrimeActive = res.crimeActive;
        this.isEarthquakeActive = res.earthquakeActive;
        this.isStormActive = res.stormActive;
        this.isCoastalFloodActive = res.floodActive;
        this.isNuclearActive = res.nuclearActive;
        this.isWildfireActive = res.wildfiresActive;
        this.isAirPollutionActive = res.airQualityActive;
        this.notifications = res.notifications;
        this.disabled = res.disabled;
        this.darkMode = res.darkMode;
      })
    );

    this.subscriptions.push(
      this.summaryMessages$.subscribe((res) => {
        console.log('Summary messages are: ', this.summaryMessages$.getValue())
      })
    );

  }

  buildMap() {
    const position = this.currentLocation$.getValue();
    this.mapBox = new mapboxgl.Map({
      container: "mapContainer",
      style: 'mapbox://styles/mapbox/' + this.style,
      zoom: this.zoom,
      center: [position.longitude, position.latitude]// [this.currentLocation$.value.longitude, this.currentLocation$.value.latitude]
    });
    // Map => Placing icon
    this.mapBox.on('load', () => {
      this.mapLoadPulsingDot(position);
    });
    // this.mapBox.addControl(new mapboxgl.NavigationControl());
  }

  ngOnInit() {
    // Notifications don't work on web version. Making sure it's a mobile version before initializing them

    if (!this.disabled) {

      /**
       *  Added by Athur for the plugin explanation
       *  
       */
      const bgService = BgRiskUpdate.activateService({
        backgroundMessage: "Available to update the risk data",
        backgroundTitle: "Checking Risk Data",
        distanceThreshold: 200, // distance threshold in meter
        riskTitle: "You have following risk data", // You can ignore this option
        riskURL: environment.APIBaseUrl + '/now/getRisks/' // You can ignore this option
      }, (data, error) => {
        /**
         * This is a plugin call back. You can add more logics here, you can  check if error exist or data exist.
         * If data exist, you can call risk api and show the notification as you want and when you want
         * And you can check if the app is in background here and process the plugin data only when app is in the background
         */
        console.log("Plugin Return Result === ", data);
      })

      // Only for a test
      setTimeout(() => {
        // Temporary Disable the plugin work
        BgRiskUpdate.changeAvailability({availability: false})
      }, 20000)

      // Only for a test
      setTimeout(() => {
        // Fully Disable the plugin work
        BgRiskUpdate.deactivateService({id: bgService});
      }, 1000 * 60)
      /**
       *  *  
       */



      
      // If it's disabled, no need to get data on init
      this.getRiskData().then(() => {
        this.buildMap();
        this.loading = false;
      }).catch((err) => { throw err });
    }
    // Show message "All Risks are Active" or // No risks are active
    if (!this.isAirPollutionActive && !this.isCrimeActive && !this.isEarthquakeActive && !this.isCoastalFloodActive && !this.isNuclearActive && !this.isStormActive && !this.isWildfireActive) {
      this.allTogglesDeactivated = true;
    } else this.allTogglesDeactivated = false;

    if (this.isAirPollutionActive && this.isCrimeActive && this.isEarthquakeActive && this.isCoastalFloodActive && this.isNuclearActive && this.isStormActive && this.isWildfireActive) {
      this.allTogglesActivated = true;
    } else this.allTogglesActivated = false;
  }

  ngAfterViewInit() {
    /* 
    * Update the data every 5 minutes, depending on location 
    */
    this.subscriptions.push(
      interval(60 * 1 * 1000).subscribe(async () => {
        try {
          // (1) make sure session is still valid
          await this.checkSession();
          // (2) update location and risk data
          await this.getRiskData();
          this.loading = false;
        } catch (err) {
          throw err;
        }
      })
    );
  }

  /** Map => Loads a pulsing dot at the current currentPosition$ and risk color */
  mapLoadPulsingDot(position: PositionModel): void {
    const crimeScore = this.riskData$.getValue().crimeScore;
    var size = 200;
    /* Return the first part of the RGB value of the color for the icon, based on risk severity */
    const getColor = function (contrast: 'dark' | 'light'): string {
      switch (crimeScore) {
        case 'Very Low':
          if (contrast === 'dark') {
            return '45, 211, 111';
          }
          if (contrast === 'light') {
            return '160, 210, 170';
          }
          break;
        case 'Low':
          if (contrast === 'dark') {
            return '45, 211, 111';
          }
          if (contrast === 'light') {
            return '160, 210, 170';
          }
          break;
        case 'Moderate':
          if (contrast === 'dark') {
            return '255, 196, 9';
          }
          if (contrast === 'light') {
            return '255, 215, 95';
          }
          break;
        case 'High':
          if (contrast === 'dark') {
            return '235, 68, 90';
          }
          if (contrast === 'light') {
            return '240, 130, 145';
          }
          break;
        case 'Very High':
          if (contrast === 'dark') {
            return '235, 68, 90';
          }
          if (contrast === 'light') {
            return '240, 130, 145';
          }
          break;
        default:
          if (contrast === 'dark') {
            return '146, 148, 156';
          }
          if (contrast === 'light') {
            return '184, 186, 190';
          }
          break;
      }
    };
    // implementation of CustomLayerInterface to draw a pulsing dot icon on the map
    // see https://docs.mapbox.com/mapbox-gl-js/api/#customlayerinterface for more info
    var pulsingDot = {
      width: size,
      height: size,
      data: new Uint8Array(size * size * 4),
      context: {} as CanvasRenderingContext2D,

      // get rendering context for the map canvas when layer is added to the map
      onAdd: () => {
        var canvas = document.createElement('canvas');
        canvas.width = pulsingDot.width;
        canvas.height = pulsingDot.height;
        pulsingDot.context = canvas.getContext('2d');
      },

      // called once before every frame where the icon will be used
      render: () => {
        var duration = 1000;
        var t = (performance.now() % duration) / duration;

        var radius = (size / 2) * 0.3;
        var outerRadius = (size / 2) * 0.7 * t + radius;
        var context = pulsingDot.context;

        // draw outer circle
        pulsingDot.context.clearRect(0, 0, pulsingDot.width, pulsingDot.height);
        pulsingDot.context.beginPath();
        pulsingDot.context.arc(
          pulsingDot.width / 2,
          pulsingDot.height / 2,
          outerRadius,
          0,
          Math.PI * 2
        );
        context.fillStyle = 'rgba(' + getColor('light') + ',' + (1 - t) + ')';
        context.fill();

        // draw inner circle
        context.beginPath();
        context.arc(
          pulsingDot.width / 2,
          pulsingDot.height / 2,
          radius,
          0,
          Math.PI * 2
        );
        context.fillStyle = 'rgba(' + getColor('dark') + ', 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // update this image's data with data from the canvas
        pulsingDot.data = context.getImageData(
          0,
          0,
          pulsingDot.width,
          pulsingDot.height
        ).data as any;

        // continuously repaint the map, resulting in the smooth animation of the dot
        this.mapBox.triggerRepaint();

        // return `true` to let the map know that the image was updated
        return true;
      }
    };

    // After first execution, clean up before creating another point
    if (this.mapBox.hasImage('pulsing-dot')) this.mapBox.removeImage('pulsing-dot');
    if (this.mapBox.getLayer('points')) this.mapBox.removeLayer('points');
    if (this.mapBox.getSource('points')) this.mapBox.removeSource('points');

    this.mapBox.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
    this.mapBox.addSource('points', {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [position.longitude, position.latitude]
            }
          } as any
        ]
      }
    });
    this.mapBox.addLayer({
      'id': 'points',
      'type': 'symbol',
      'source': 'points',
      'layout': {
        'icon-image': 'pulsing-dot'
      }
    });

  }

  /** Returns user position */
  async getPosition(): Promise<PositionModel> {
    try {
      const position = await this.trackerService.getCurrentLocation();
      if (!environment.production) console.log('Current position data: ', position);
      return position;
    } catch (err) {
      throw err;
    }
  }

  /** Updates the user preferences with the toggled (active) or disabled risks */
  updateTogglePreferences(event: any): void {
    /** MUST STORE THIS DATA IN LOCAL STORAGE(preferably) OR IN DATABASE SOMEHOW */
    this.userService.userPreferences$.next({
      airQualityActive: this.isAirPollutionActive,
      crimeActive: this.isCrimeActive,
      earthquakeActive: this.isEarthquakeActive,
      floodActive: this.isCoastalFloodActive,
      nuclearActive: this.isNuclearActive,
      stormActive: this.isStormActive,
      wildfiresActive: this.isWildfireActive,
      notifications: this.notifications,
      disabled: this.disabled,
      darkMode: this.darkMode
    });

    if (!this.isAirPollutionActive && !this.isCrimeActive && !this.isEarthquakeActive && !this.isCoastalFloodActive && !this.isNuclearActive && !this.isStormActive && !this.isWildfireActive) {
      this.allTogglesDeactivated = true;
    } else this.allTogglesDeactivated = false;

    if (this.isAirPollutionActive && this.isCrimeActive && this.isEarthquakeActive && this.isCoastalFloodActive && this.isNuclearActive && this.isStormActive && this.isWildfireActive) {
      this.allTogglesActivated = true;
    } else this.allTogglesActivated = false;

    if (!environment.production) {
      console.log('Toggle Preferences have been updated');
    }
  }

  /**
   * Gets (1) location data from GPS then (2) gets the Risk data
   * On dev environment, defaults to Harvard university's coordinates (42.3, -71.11)
   * If force is specified, will show data even though distance since last point is < than 100m (manually triggered by ion-refresh)
   */
  async getRiskData(force?: boolean): Promise<void> {
    try {
      this.loading = true;
      let positionData: PositionModel;
      /** First, get the location data */
      /*
      if (!environment.production) {
        // Putting us on US Space & Rocket Center in Alabama
        positionData = {
          latitude: 34.7111,
          longitude: -86.6539,
          accuracy: 37,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        }
      } else {*/
      positionData = await this.getPosition();
      //}
      /**
       * Make sure the location is far enough (200m) from previous updated location
      */
      const previousLocation = this.previousLocation$.value;
      if (previousLocation?.latitude && !force && !this.noticeMessage$.value) {
        const oldLat = previousLocation.latitude;
        const oldLong = previousLocation.longitude;
        const newLat = positionData.latitude;
        const newLong = positionData.longitude;
        const distance = await this.trackerService.calcDistance(oldLat, oldLong, newLat, newLong);
        // If distance lower than 200 then no need to request a new data, cancel request
        if (!environment.production) console.log('Canceling getRisk request, distance < 200m');
        if (distance < 200) {
          this.loading = false;
          return;
        }
      }

      this.previousLocation$.next(this.currentLocation$.value);
      this.currentLocation$.next(positionData);
      const riskData = await this.riskService.getRisks(positionData.latitude, positionData.longitude, force);
      this.riskData$.next(riskData);
      if (!environment.production) console.log('Risk Data is ', this.riskData$.getValue());
      this.lastUpdateTime = Date.now();
      this.loading = false;

      // Remove any prior error message since this request suceeded
      this.noticeMessage$.next(null);
      // Map => Checking if map exists
      if (!this.mapBox) {
        this.buildMap();
      }

      this.mapBox.on('load', () => {
        // Map => Recentering to new position coordinates, if map already defined
        this.mapBox.flyTo({
          center: [positionData.longitude, positionData.latitude],
          speed: 1
        });
        // Map => Update icon position
        this.mapLoadPulsingDot(positionData);
      });

      // Summaries => Generate Summary Messages
      let globalTitle, globalText, globalIcon, airPollutionText, airPollutionIcon, alertTitle, alertText, alertIcon, crimeText, crimeIcon, earthquakeText, earthquakeIcon, floodText, floodIcon, nuclearText, nuclearIcon, stormsText, stormsIcon, wildfiresText, wildfiresIcon;
      let majorThreats = [];

      if (riskData.crimeScore == 'Very Low' || riskData.crimeScore == 'Low') {
        crimeText = "There's a low crime risk in your current vicinity."
        crimeIcon = 'checkmark';
      }
      if (riskData.crimeScore == 'moderate') {
        crimeText = "There's a moderate Crime Risk in your current vicinity."
        crimeIcon = 'checkmark';
      }
      if (riskData.crimeScore == 'Very High' || riskData.crimeScore == 'High') {
        crimeText = "There is a significant Crime Risk in your current vicinity. Stay safe.";
        crimeIcon = 'alert-outline';
        // majorThreats = (!majorThreats) ? 'Crime' : ', Crime';
      }
      if (riskData.stormRisk) {
        stormsText = 'Storm events occur frequently in your current location.';
        stormsIcon = 'alert-outline';
        majorThreats.push('Storm events');
      } else {
        stormsText = 'Your location has a low chance of being hit by a Storm event, such as a tornado or a hurricane.';
        stormsIcon = 'checkmark';
      }

      if (riskData.coastalFloodRisk) {
        floodText = 'A coastal flood threat was identified in your location. Watch ouf for flood warnings.';
        floodIcon = 'alert-outline';
        majorThreats.push('Coastal flooding');
      } else {
        floodText = 'No significant coastal flood threat was identified in your current location;';
        floodIcon = 'checkmark';
      }

      if (riskData.wildfireRisk) {
        wildfiresText = 'Wildfires have a high chance of occurring in your current vicinity. What out for alerts during the fire season.';
        wildfiresIcon = 'alert-outline';
        majorThreats.push('Wildfires');
      } else {
        wildfiresText = 'Wildfires have a low chance of occurring in your location.';
        wildfiresIcon = 'checkmark';
      }

      if (riskData.earthquakeRisk) {
        earthquakeText = 'Seismic activity has been recorded at your location.';
        earthquakeIcon = 'alert-outline';
        majorThreats.push('Earthquakes');
      } else {
        earthquakeText = "There doesn't appear to be a significant seismic activity in your location.";
        earthquakeIcon = 'checkmark';
      }

      if (riskData.nuclearRisk) {
        nuclearText = 'Your current location is close to one or multiple nuclear power plants or waste storage sites.'
        nuclearIcon = 'alert-outline';
        majorThreats.push('Nuclear');
      } else {
        nuclearText = 'Your location is far from any nuclear power plant or waste storage sites.';
        nuclearIcon = 'checkmark';
      }

      if (riskData.airPollutionRisk) {
        airPollutionText = 'Episodes of air pollution have been frequently reported in your area. During such episodes, air quality can become unhealthy.'
        airPollutionIcon = 'alert-outline';
        majorThreats.push('Air pollution');
      } else {
        airPollutionText = 'Your location has no significant air pollution issues.';
        airPollutionIcon = 'checkmark';
      }

      // NOAA Alerts 
      // MUST BE IMPLEMENTED

      // Global Message
      const threatsLength = majorThreats.length;
      if (!riskData.crimeRisk && threatsLength == 0) {
        globalTitle = 'No threat detected';
        globalText = 'No significant threat was identified in your current location.';
        globalIcon = 'shield-checkmark-outline';
      }
      else if (riskData.crimeRisk && threatsLength == 0) {
        globalTitle = 'Crime Threat';
        globalText = 'There is a significant Crime Risk in your current vicinity. Stay safe.';
        globalIcon = 'warning-outline'
      }
      else if (riskData.crimeRisk && threatsLength > 0) {
        globalTitle = 'Multiple Threats';
        globalText = 'There is a significant Crime Risk in your current vicinity. More over, ';
        globalIcon = 'warning-outline';

        for (let i = 0; i < threatsLength; i++) {
          if (i !== 0) globalText += ', ';
          globalText += majorThreats[i];
        }
        globalText += ' could pose long term risks but no immediate danger.';
      }

      this.summaryMessages$.next({
        globalTitle: globalTitle,
        globalIcon: globalIcon,
        globalText: globalText,
        airPollutionText: airPollutionText,
        airPollutionIcon: airPollutionIcon,
        alertTitle: alertTitle,
        alertIcon: alertIcon,
        alertText: alertTitle,
        crimeText: crimeText,
        crimeIcon: crimeIcon,
        earthquakesText: earthquakeText,
        earthquakesIcon: earthquakeIcon,
        floodText: floodText,
        floodIcon: floodIcon,
        nuclearText: nuclearText,
        nuclearIcon: nuclearIcon,
        stormsText: stormsText,
        stormsIcon: stormsIcon,
        wildfiresText: wildfiresText,
        wildfiresIcon: wildfiresIcon
      });

      // Sending Notifications if high Crime risk 
      if (true) {// riskData.crimeRisk) {
        if (this.notifs) {
          LocalNotifications.cancel(this.notifs);
        }
        /** Could use this code to pop the notifications to the foreground if android
         * if (isPlatform('android') {
            const notificationChannel: NotificationChannel = {
                id: 'pop-notifications',// id must match android/app/src/main/res/values/strings.xml's default_notification_channel_id
                name: 'Pop notifications',
                description: 'Pop notifications',                
                importance: 5,
                visibility: 1
            };
 
            PushNotifications.createChannel(notificationChannel);
            LocalNotifications.createChannel(notificationChannel);
        }
        */
        if (this.userService.userPreferences$.getValue().notifications !== 'disabled' && riskData.crimeRisk) {
          this.notifs = await LocalNotifications.schedule({
            notifications: [
              {
                id: 1,
                title: 'High Crime Risk',
                body: 'There could be a significant Crime Risk in your current vicinity. Stay safe.',
                group: 'risk-alert',
                //extra: notification.data,
                // channelId: 'risk-notifications'
              }
            ]
          });
          console.log('scheduled notifications', this.notifs);
        } /*else if (this.userService.userPreferences$.getValue().notifications === 'all') {
          // Should implement other notifications here normally
        }*/
      }

      return;
    } catch (err) {
      this.loading = true;
      // Avoiding undefined error messages...
      if (err.error) {
        if (err.error.message) {
          if (err.error.message == 'This area is outside the US. Currently, Augurisk only supports US territories.') {
            this.noticeMessage$.next({
              message: 'Augurisk Now is only available in the United States. Stay tuned for updates regarding our expansion into new countries. ',
              type: 'danger'
            });
          } else if (err.error.message == "Too many requests. Please try again in a few minutes.") {
            this.noticeMessage$.next({
              message: 'Too many requests. Try again in a minute.',
              type: 'danger'
            });
          } else if (err.error.message == "Couldn't get Risks data.") {
            this.noticeMessage$.next({
              message: 'Error while attempting to retrieve Risk Data.',
              type: 'danger'
            });
          } else if (err.error.message.includes('The provided User Token or API Key are either invalid, or expired')) {
            /*
                        if (this.riskConnexionRetries <= 2) {
                          this.checkSession(true).then((res) => {
                            this.getRiskData();
                          }).catch((err) => {
                            throw err;
                          });
                        }
                        this.riskConnexionRetries = this.riskConnexionRetries + 1;
                        */
          }
        }
      } if (err.message == 'Position Error') {
        this.noticeMessage$.next({
          message: 'Error while requesting your position. Please ensure you allowed GPS Location permissions.',
          type: 'danger'
        });
      }

      this.lastUpdateTime = this.lastUpdateTime;
      this.loading = false;
      throw err;
    }
  }

  /**
   * ion-refresher event, when you pull the screen down
   * @param event 
   */
  async doRefresh(event) {
    this.loading = true;
    try {
      setTimeout(() => {
        event.target.complete();
      }, 5000);
      // Doesn't need to unsubscribe since we only take 1 time
      if (this.disabled === false) {
        await this.getRiskData(true);
        this.loading = false;
        event.target.complete();
        if (!environment.production) console.log('Begin ion-refresher async operation');
      } else {
        this.loading = false;
        event.target.complete();
        if (!environment.production) console.log('ion-refresher ignored because currently disabled');
      }
      event.target.complete();

    } catch (err) {
      this.loading = false;
      event.target.complete();
      throw err;
    }
  }

  /** 
   * Clicks on activate or disable segments
   */
  segmentChanged(event: any): void {
    // console.log('Segment changed:', event.detail.value);
    if (event.detail.value == 'active') {
      this.disabled = false;
      this.userService.userPreferences$.next({
        airQualityActive: this.isAirPollutionActive,
        crimeActive: this.isCrimeActive,
        earthquakeActive: this.isEarthquakeActive,
        floodActive: this.isCoastalFloodActive,
        nuclearActive: this.isNuclearActive,
        stormActive: this.isStormActive,
        wildfiresActive: this.isWildfireActive,
        notifications: this.notifications,
        disabled: false
      });
      this.loading = true;
      this.getRiskData().then(() => {
        this.loading = false;
      }).catch((err) => {
        this.loading = false;
        throw err
      });
    }
    else if (event.detail.value == 'disabled') {
      this.noticeMessage$.next(null);
      this.disabled = true;
      this.userService.userPreferences$.next({
        airQualityActive: this.isAirPollutionActive,
        crimeActive: this.isCrimeActive,
        earthquakeActive: this.isEarthquakeActive,
        floodActive: this.isCoastalFloodActive,
        nuclearActive: this.isNuclearActive,
        stormActive: this.isStormActive,
        wildfiresActive: this.isWildfireActive,
        notifications: this.notifications,
        disabled: true
      });
    }
    this.loading = false;
  }

  /**
   * Notifications fab button to change the desired notifications
   */
  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Manage Notifications',
      // cssClass: 'my-custom-class',
      buttons: [{
        text: 'All notifications',
        role: (this.notifications === 'all') ? 'destructive' : '',
        icon: 'notifications-circle-outline',
        handler: () => {
          this.notifications = 'all';
          this.userService.userPreferences$.next({
            airQualityActive: this.isAirPollutionActive,
            crimeActive: this.isCrimeActive,
            earthquakeActive: this.isEarthquakeActive,
            floodActive: this.isCoastalFloodActive,
            nuclearActive: this.isNuclearActive,
            stormActive: this.isStormActive,
            wildfiresActive: this.isWildfireActive,
            notifications: 'all',
            disabled: this.disabled
          })
          if (!environment.production) console.log('All notifications');
        }
      }, {
        text: 'High threats only',
        role: (this.notifications === 'highThreats') ? 'destructive' : '',
        icon: 'alert-circle-outline',
        handler: () => {
          this.notifications = 'highThreats';
          this.userService.userPreferences$.next({
            airQualityActive: this.isAirPollutionActive,
            crimeActive: this.isCrimeActive,
            earthquakeActive: this.isEarthquakeActive,
            floodActive: this.isCoastalFloodActive,
            nuclearActive: this.isNuclearActive,
            stormActive: this.isStormActive,
            wildfiresActive: this.isWildfireActive,
            notifications: 'highThreats',
            disabled: this.disabled
          });
          if (!environment.production) console.log('High threats clicked');
        }
      }, {
        text: 'Disable Notifications',
        role: (this.notifications === 'disabled') ? 'destructive' : '',
        icon: 'notifications-off-circle-outline',
        handler: () => {
          this.notifications = 'disabled';
          this.userService.userPreferences$.next({
            airQualityActive: this.isAirPollutionActive,
            crimeActive: this.isCrimeActive,
            earthquakeActive: this.isEarthquakeActive,
            floodActive: this.isCoastalFloodActive,
            nuclearActive: this.isNuclearActive,
            stormActive: this.isStormActive,
            wildfiresActive: this.isWildfireActive,
            notifications: 'disabled',
            disabled: this.disabled
          });
          if (!environment.production) console.log('Disable clicked');
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          if (!environment.production) console.log('Cancel clicked');
        }
      }]
    });
    await actionSheet.present();
  }

  /**
   * Makes sure the session hasn't expired
   */
  checkSession(force?: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.cognitoService.checkSessionAndRenew(force)
        .then((res) => {
          if (!environment.production) console.log('Dashboard Session Check successful');
          resolve(true);
        }, (err) => {
          // If user not logged in, redirect him to Login page
          if (!environment.production) console.log('Error during Dashboard Session check: ', err);
          this.router.navigate(['auth/login']);
          reject(false);
        });
    });
  }

  async presentModal(modalComponent: 'crime-risk' | 'air-pollution' | 'storms' | 'wildfires' | 'flood-risk' | 'earthquakes' | 'nuclear') {
    if (!modalComponent) throw 'No modal component selected';
    let component;
    switch (modalComponent) {
      case 'crime-risk':
        component = CrimeDetailsComponent;
        break;
      case 'air-pollution':
        component = AirPollutionDetailsComponent;
        break;
      case 'storms':
        component = StormDetailsComponent;
        break;
      case 'wildfires':
        component = WildfireDetailsComponent;
        break;
      case 'flood-risk':
        component = FloodDetailsComponent;
        break;
      case 'earthquakes':
        component = EarthquakeDetailsComponent;
        break;
      case 'nuclear':
        component = NuclearDetailsComponent;
        break;
    }
    const modal = await this.modalController.create({
      component: component,
      // cssClass: 'my-custom-class',
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      animated: true,
      backdropDismiss: true,
      keyboardClose: true,

    });
    return await modal.present();
  }


  async generateSummaries(): Promise<void> {
    try {

    } catch (err) {
      throw err;
    }
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach((sub) => {
        sub.unsubscribe();
      });
    }
  }

}
