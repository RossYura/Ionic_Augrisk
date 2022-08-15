import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { UserModel, UserPreferences } from '../models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable({
    providedIn: 'root'
})
export class UserService {

    private subscriptions: Subscription[] = [];
    public getUserApiUrl = environment.APIBaseUrl + "getUsersByEmail";
    public putUserApiUrl = environment.APIBaseUrl + "putUsers";
    public userData$: BehaviorSubject<UserModel>;
    public userPreferences$: BehaviorSubject<UserPreferences>;
    public disabled$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public guardCheckInProgress$: BehaviorSubject<boolean>;
    token: any;

    // The Authorization: Bearer $idToken is added through the interceptor 
    constructor(private http: HttpClient) {
        if (!this.guardCheckInProgress$) {
            this.guardCheckInProgress$ = new BehaviorSubject(false);
        }
        if (!this.userData$) {
            this.initiateValues();
        }
        if (!this.userPreferences$) {
            const userPreferencesLocalStorage: UserPreferences = this.getUserPreferences();

            if (userPreferencesLocalStorage) {
                this.userPreferences$ = new BehaviorSubject(userPreferencesLocalStorage);
            }
        }

        // Initiate userPreferences$ based on localStorage and Update local storage whenever userPreferences$ changes.
        this.subscriptions.push(
            this.userPreferences$.subscribe((res: UserPreferences) => {
                this.setUserPreferences(res);
            })
        );
    }

    public getHttpOptions() {
        this.token = this.getUserData().accessToken;
        const httpOptions = {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
                Authorization: "Bearer " + this.token
            })
        };
        return httpOptions;
    }

    initiateValues(): void {
        const userData = this.getUserData();
        if (!userData) {
            return;
        } else {
            this.userData$ = new BehaviorSubject<UserModel>(userData);
        }
    }

    public getStoredUser(): Observable<UserModel> {
        return this.userData$.asObservable();
    }

    /** Obtain local data from Cognito */
    public getUserData(): UserModel {
        // console.log('get User Local data:', localStorage.getItem('userData'));
        return JSON.parse(localStorage.getItem("userData"));
    }

    /** Obtain local user preferences */
    public getUserPreferences(): UserPreferences {
        let userPreferences: UserPreferences = JSON.parse(localStorage.getItem('nowUserPreferences'));
        if (!userPreferences) userPreferences = {
            crimeActive: true,
            airQualityActive: true,
            earthquakeActive: false,
            nuclearActive: false,
            stormActive: true,
            floodActive: false,
            wildfiresActive: false,
            darkMode: false,
            notifications: "highThreats",
            disabled: false
        };
        return userPreferences;
    }

    /** Update local data that was taken from Cognito */
    public setUserData(userData: UserModel): Promise<UserModel> {
        return new Promise(resolve => {
            localStorage.setItem("userData", JSON.stringify(userData));
            resolve(userData);
        });
    }

    /** Update local data that was taken from Cognito */
    public setUserPreferences(userPreferences: UserPreferences): Promise<UserPreferences> {
        return new Promise(resolve => {
            localStorage.setItem("nowUserPreferences", JSON.stringify(userPreferences));
            resolve(userPreferences);
        });
    }

    /** Clear local data */
    public clearUserData(): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.removeItem("userData");
                resolve();
            });
        });
    }

    /** Clear local data */
    public clearUserPreferences(): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.removeItem("userPreferences");
                resolve();
            });
        });
    }
    
	public updateUserData(newData: UserModel): Promise<UserModel> {
		return new Promise((resolve, reject) => {
			let updatedData: UserModel = this.getUserData();

			if (newData.name) updatedData.name = newData.name;
			if (newData.phone) updatedData.phone = newData.phone;
			if (newData.address) {
				if (newData.address.country) {
					updatedData.address = newData.address;
				}
				// if (newData.address.country && newData.address.locality) {
				// 	updatedData.address = newData.address;
				// }
			}
            if (newData.companyName) updatedData.companyName = newData.companyName;
			if (newData.optin) updatedData.optin = newData.optin; 
			if (newData.notifications) updatedData.notifications = newData.notifications;
            if (newData.language) updatedData.language = newData.language;

			this.setUserData(updatedData);
			resolve(updatedData);
		});
	}

    /**
	 * getUsersByEmail
	 * Download the User data from dynamodb
	 * @param {UserModel} userPreferences
	 * @returns {Observable<UserModel>} userPreferences
	 */
    public getUserByEmail(userData = null): Observable<UserModel> {
        if (userData) {
            const httpOps = {
                headers: new HttpHeaders({
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + userData.idToken
                })
            };
            return this.http.get<UserModel>(this.getUserApiUrl, httpOps);
        }

        return this.http.get<UserModel>(this.getUserApiUrl, this.getHttpOptions());
    }

	/**
	 * updatePreferences
	 * Change values of user preferences (attributes) as (optin, notifications ...)
	 *
	 * @param {UserModel} userPreferences
	 * @returns {Observable<UserModel>} userPreferences
	 */
    updatePreferences(userPreferences: UserModel): Observable<UserModel> {
        return this.http.put<UserModel>(
            this.putUserApiUrl,
            userPreferences,
            this.getHttpOptions()
        );
    }

    /**
     * Deletes user from dynamodb and deactivates account on cognito
     */
    deleteUser(): Promise<any> {
        return new Promise((resolve, reject) => {
            const userData = this.getUserData();
            this.http.delete(environment.APIBaseUrl + 'deleteUser').subscribe((res) => {
                resolve(res);
            }, (err) => {
                reject(err);
            })
        });
    }

    /**
	 * Updates the user "lastConnexion" field to Date.now() / 1000
	 */
    updateLastConnexionTime(): Observable<any> {
        return this.http.put(environment.APIBaseUrl + 'changeUserLastConnexion', {});
    }
}