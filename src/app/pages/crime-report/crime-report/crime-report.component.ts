import { Component, OnInit } from '@angular/core';
import { Subscription, BehaviorSubject, interval } from 'rxjs';
import { UserModel } from 'src/app/core/models/user.model';
import { CrimeService } from '../crime.service';
import { environment } from 'src/environments/environment';
import { RiskService } from 'src/app/core/services/risk.service';
import { RiskModel } from 'src/app/core/models/risk.model';
import { PositionModel, TrackerService } from 'src/app/core/services/tracker.service';
import { MessageModel } from 'src/app/core/models/error-message.model';
import { Location } from '@angular/common';

export type textColorsModel = 'success' | 'warning' | 'danger';

@Component({
	selector: 'crime-report',
	templateUrl: './crime-report.component.html',
	styleUrls: ['./crime-report.component.scss'],
})
export class CrimeReportComponent implements OnInit {

	public userData: UserModel;
	public currentProjectId: string;
	public currentProjectAddress: string;
	public loading$ = new BehaviorSubject<boolean>(true);
	public riskData$: BehaviorSubject<RiskModel> = new BehaviorSubject(null);
	public currentLocation$: BehaviorSubject<PositionModel> = new BehaviorSubject(null);
	public previousLocation$: BehaviorSubject<PositionModel> = new BehaviorSubject(null);
	public noticeMessage$: BehaviorSubject<MessageModel> = new BehaviorSubject(null);
	public lastUpdateTime: number;

	// Project data
	public countyId: any;
	public countyName: string;
	public stateName: string;
	public lastUpdateDate: string | Date;

	// Initializing summary blocs variables
	public riskScore$ = new BehaviorSubject<number>(50);
	public riskScoreText$ = new BehaviorSubject<string>('Loading...');
	public summaryText: string;

	// Risk Variables
	private isReal: number;
	public predictedOrObs$ = new BehaviorSubject<string>(null);
	public medianHouseholdIncome$ = new BehaviorSubject<number>(null);
	public percentUnemployed$ = new BehaviorSubject<number>(null);
	public population$ = new BehaviorSubject<number>(null);
	public populationDensity$ = new BehaviorSubject<number>(null);
	public povertyRate$ = new BehaviorSubject<number>(null);
	public policeDepNearby$ = new BehaviorSubject<number>(null);
	public violentCrimeNumber$ = new BehaviorSubject<number>(null);
	public propertyCrimeNumber$ = new BehaviorSubject<number>(null);
	public MVTNumber$ = new BehaviorSubject<number>(null); // Motor Vehicule Theft Number
	public vandalismNumber$ = new BehaviorSubject<number>(null);
	public propertyCrimeScore$ = new BehaviorSubject<number>(null);
	public violentCrimeScore$ = new BehaviorSubject<number>(null);
	public motorVehiculeTheftScore$ = new BehaviorSubject<number>(null);
	public vandalismScore$ = new BehaviorSubject<number>(null);
	public policeDepScore$ = new BehaviorSubject<number>(null);
	// Colors
	public policeDepColor$ = new BehaviorSubject<textColorsModel>(null);
	public violentCrimeColor$ = new BehaviorSubject<textColorsModel>(null);
	public propertyCrimeColor$ = new BehaviorSubject<textColorsModel>(null);
	public MVTColor$ = new BehaviorSubject<textColorsModel>(null);
	public vandalismColor$ = new BehaviorSubject<textColorsModel>(null);


	constructor(private riskService: RiskService, private trackerService: TrackerService, private _location: Location) { }

	ngOnInit() {
		this.getRiskData().then((res) => {
			this.loading$.next(false);
		}, (err) => {
			this.loading$.next(false);
			throw err;
		});

	}

	/** Returns user position */
	async getPosition(): Promise<PositionModel> {
		try {
			const position = await this.trackerService.getCurrentLocation();
			if (!environment.production) console.log('Current position data: ', position);
			return position;
		}
		catch (error) {
			throw error;
		}
	}

	/**
	 * Gets (1) location data from GPS then (2) gets the Risk data
	 * On dev environment, defaults to Harvard university's coordinates (42.3, -71.11)
	 * If force is specified, will show data even though distance since last point is < than 100m (manually triggered by ion-refresh)
	 */
	async getRiskData(force?: boolean): Promise<RiskModel> {
		try {
			this.loading$.next(true);
			let positionData: PositionModel;
			/** First, get the location data 
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
				if (distance < 200) return;
			}

			this.previousLocation$.next(this.currentLocation$.value);
			this.currentLocation$.next(positionData);
			const riskData = await this.riskService.getRisks(positionData.latitude, positionData.longitude, force);
			this.riskData$.next(riskData);
			if (!environment.production) console.log('Risk Data is ', this.riskData$.getValue());
			this.lastUpdateTime = Date.now();
			this.loading$.next(false);

			// Update variables
			this.riskScoreText$.next(riskData.crimeScore);
			this.riskScore$.next(this.getScoreValue(riskData.crimeScore));

			let crimeData;
			if (!environment.production) console.log('Risk data is ', riskData);
			if (!riskData.crimeData) {
				this.noticeMessage$.next({
					message: 'An error occurred while attempting to retrieve Crime data for your location.',
					type: 'danger'
				});
			}
			crimeData = JSON.parse(riskData.crimeData);
			this.riskData$.next(riskData);

			// TODO: MUST REPLACE WITH REAL DATA
			this.isReal = Number(crimeData[0]);
			this.predictedOrObs$.next((this.isReal === 1) ? 'observed' : 'predicted');
			this.medianHouseholdIncome$.next(Number(crimeData[1]));
			this.percentUnemployed$.next(Math.round(Number(crimeData[2]) * 100 * 100) / 100);
			this.population$.next(Number(crimeData[3]));
			this.populationDensity$.next(Math.round(Number(crimeData[4])));
			this.povertyRate$.next(Number(crimeData[5]));
			this.policeDepNearby$.next(Number(crimeData[6]));
			this.violentCrimeNumber$.next(Math.round(Number(crimeData[7])));
			this.propertyCrimeNumber$.next(Math.round(Number(crimeData[8])));
			this.MVTNumber$.next(Math.round(Number(crimeData[9]))); // Motor Vehicule Theft Number
			this.vandalismNumber$.next(Math.round(Number(crimeData[10])));
			this.propertyCrimeScore$.next(Number(crimeData[11]));
			this.violentCrimeScore$.next(Number(crimeData[12]));
			this.motorVehiculeTheftScore$.next(Number(crimeData[13]));
			this.vandalismScore$.next(Number(crimeData[14]));

			if (this.policeDepNearby$.value === 0) {
				this.policeDepColor$.next('danger');
				this.policeDepScore$.next(100);
			} else if (this.policeDepNearby$.value === 1) {
				this.policeDepColor$.next('warning');
				this.policeDepScore$.next(35);
			} else {
				this.policeDepColor$.next('success');
				this.policeDepScore$.next(0);
			}
			this.violentCrimeColor$.next(this.returnRiskScoreColor(this.violentCrimeScore$.value));
			this.propertyCrimeColor$.next(this.returnRiskScoreColor(this.propertyCrimeScore$.value));
			this.MVTColor$.next(this.returnRiskScoreColor(this.motorVehiculeTheftScore$.value));
			this.vandalismColor$.next(this.returnRiskScoreColor(this.vandalismScore$.value));

			// Remove any prior error message since this request suceeded
			this.noticeMessage$.next(null);
			return riskData;
		} catch (err) {
			this.loading$.next(true);
			// Avoiding undefined error messages...
			if (err.error) {
				if (err.error.message) {
					if (err.error.message.includes('This area is outside the US. Currently, Augurisk only supports US territories.')) {
						this.noticeMessage$.next({
							message: 'Unfortunately, Augurisk Now is only available in the United States. Stay tuned for any updates regarding our expansion into new countries. ',
							type: 'danger'
						});
					} else if (err.error.message == "Too many requests. Please try again in a few minutes.") {
						this.noticeMessage$.next({
							message: 'Too many requests. Try again in a minute.',
							type: 'danger'
						});
					} else if (err.error.message == "Couldn't get Risks data.") {
						this.noticeMessage$.next({
							message: 'Error while attempting to retrieve Crime Data.',
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
				else {
					this.noticeMessage$.next({
						message: 'An error occurred while attempting to retrieve Crime Data.',
						type: 'danger'
					});
				}
			} else {
				this.noticeMessage$.next({
					message: 'An error occurred while attempting to retrieve Crime Data.',
					type: 'danger'
				});
			}
			this.loading$.next(false);
			throw err;
		}
	}

	/**
	 * ion-refresher event, when you pull the screen down
	 * @param event 
	 */
	async doRefresh(event) {
		this.loading$.next(true);
		try {
			setTimeout(() => {
				event.target.complete();
			}, 5000);
			// Doesn't need to unsubscribe since we only take 1 time
			await this.getRiskData(true);
			this.loading$.next(false);
			event.target.complete();
			if (!environment.production) console.log('Begin ion-refresher async operation');

			event.target.complete();

		} catch (err) {
			event.target.complete();
			throw err;
		}
	}

	/** Gets the score value from text score like high or low */
	getScoreValue(textScore: string): number {
		if (textScore === 'Very low') {
			return 15;
		} else if (textScore === 'Low') {
			return 30;
			// high or very high
		} else if (textScore === 'Moderate') {
			return 50;
			// high or very high
		} else if (textScore === 'High') {
			return 70;
			// high or very high
		} else if (textScore === 'Very High') {
			return 85;
			// high or very high
		}
	}

	// ** Gets color depending on risk severity ** //
	public returnRiskScoreColor(score: number | string): textColorsModel {
		if (typeof score === 'string') score = Number(score);
		if (score <= 35) return 'success';
		else if (score < 60) return 'warning';
		else return 'danger';
	}

	goBack() {
		this._location.back();
	}

}
