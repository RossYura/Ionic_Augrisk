import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserModel } from '../models/user.model';
import { RiskModel } from '../models/risk.model';
import { environment } from 'src/environments/environment';
import { CognitoService } from './cognito.service';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class RiskService {

	userData: UserModel;
	private httpOptions: object;
	public riskData$: BehaviorSubject<RiskModel>;
	constructor(
		private http: HttpClient,
		private cognitoService: CognitoService,
		private userService: UserService,
		private router: Router
	) {
		// this.userData = this.userService.getUserData();
		/**
		if (!this.httpOptions) {
			this.cognitoService.returnAuthorizedHttpHeaders().then((res) => {
				this.httpOptions = res;
			}).catch((err) => {
				throw err;
			})
		}
		*/
	}

	/**
	 * initializeToken
	 * Set headers and token on httpOptions
	initializeToken(): void {
		if (this.userData.idToken) {
			this.httpOptions = {
				headers: new HttpHeaders({
					"Content-Type": "application/json",
					Authorization: "Bearer " + this.userData.idToken
				})
			};
		} else {
			// not logged in ? no headers
          this.router.navigate(['auth/login']);
		}
	}
	*/



	getRisks(latitude: number, longitude: number, force?: boolean): Promise<RiskModel> {
		return new Promise(async (resolve, reject) => {
			try {/*
				if (!this.httpOptions) {
					this.httpOptions = await this.cognitoService.returnAuthorizedHttpHeaders();
				}
				if (!environment.production) console.log('Using headers: ', this.httpOptions);
				*/

				const url = environment.APIBaseUrl + '/now/getRisks/' + latitude + '/' + longitude;
				// this.http.get<RiskModel>(url, this.httpOptions).subscribe((res: RiskModel) => {
				this.http.get<RiskModel>(url).subscribe((res: RiskModel) => {
					resolve(res);
				}, (err) => {
					reject(err);
				});
			} catch (err) {
				reject(err);
			}
		});

	}

}
