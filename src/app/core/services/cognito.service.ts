import { Injectable } from "@angular/core";
import * as AWSCognito from 'amazon-cognito-identity-js';
import { environment } from 'src/environments/environment';
import { UserModel, AddressModel } from '../models/user.model';
import { UserService } from './user.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface PoolDataInterface {
    UserPoolId: string;
    ClientId: string;
    Storage?: any;
}

export interface refreshTokenResult {
    status: string;
    access_token: string;
    id_token: string;
    refresh_token: string;
}

export interface CognitoSession {
    idToken?: {
        jwtToken: string;
        payload: any
    };
    refreshToken?: {
        token: string;
    };
    accessToken?: {
        jwtToken: string;
        payload: any;
    };
    clockDrift?: any;
    getIdToken(): any;
    isValid(): any;
}

export interface CognitoFederatedIdentity {
    id_token: string,
    access_token: string,
    refresh_token: string,
    expires_in?: number,
    token_type?: "Bearer",
    email?: string,
    at_hash?: string,
    sub?: string,
    "cognito:groups"?: string[],
    email_verified?: boolean,
    iss?: string,
    "cognito:username"?: string,
    aud?: string,
    identities?: [
        {
            userId: string,
            providerName: "Facebook" | "Google",
            providerType: "Facebook" | "Google",
            issuer: any,
            primary: string | boolean,
            dateCreated: string | number
        }
    ],
    token_use?: string,
    auth_time?: number,
    exp?: number,
    iat?: number,
    // the following values are only provided if user clicks on "sign in with different user" and uses his cognito login
    phone_number?: string,
    event_id?: string,
}

export type CognitoUser = AWSCognito.CognitoUser;

@Injectable({
    providedIn: 'root'
})
export class CognitoService {

    poolData: PoolDataInterface;
    userPool: AWSCognito.CognitoUserPool;
    public unconfirmed$ = new BehaviorSubject<boolean>(false);
    public userEmail$ = new BehaviorSubject<string>(null);
    public userPassword$ = new BehaviorSubject<string>(null);
    private isSessionUpdateInProgress$: BehaviorSubject<boolean>;

    constructor(private userService: UserService, private http: HttpClient) {
        this.poolData = {
            UserPoolId: environment.cognitoConf.cognito.cognitoPoolId,
            ClientId: environment.cognitoConf.cognito.cognitoClientPoolId
        };
        this.userPool = new AWSCognito.CognitoUserPool(this.poolData);
        if (!this.isSessionUpdateInProgress$) this.isSessionUpdateInProgress$ = new BehaviorSubject(false);
    }

    /**
     * Refresh Token, that expires in 60 minutes 
     * @param refreshToken: string => refresh token of the user
     */
    renew(refreshToken: string): Promise<refreshTokenResult> {
        // Making sure we don't execute this twice simultaneously like angular does often
        if (this.isSessionUpdateInProgress$.getValue() === true) {
            if (!environment.production) console.log('Aborting session renewal: session update is still in progress.');
            return;
        }
        this.isSessionUpdateInProgress$.next(true);

        if (!environment.production) console.log('renewing refresh token');
        const userPool = this.userPool;
        const cognitoUser = userPool.getCurrentUser();

        return new Promise((resolve, reject) => {
            const RefreshToken = new AWSCognito.CognitoRefreshToken({ RefreshToken: refreshToken });
            cognitoUser.refreshSession(RefreshToken, (err, session) => {
                if (err) {
                    console.log('Error while attempting to refresh session');
                    this.isSessionUpdateInProgress$.next(false);
                    reject(err);
                } else {
                    let retObj: refreshTokenResult = {
                        'status': 'SUCCESS',
                        'access_token': session.accessToken.jwtToken,
                        'id_token': session.idToken.jwtToken,
                        'refresh_token': session.refreshToken.token,
                    };
                    if (!environment.production) console.log('Session refresh succesful.', retObj);
                    this.isSessionUpdateInProgress$.next(false);
                    resolve(retObj);
                }
            });
        });
    }

    /**
     * Formats cognito raw Data into parsed Data
     * @param cognitoSession: CognitoSession
     */
    formatCognitoData(cognitoSession: CognitoSession): UserModel {
        const cognitoUser: string = cognitoSession.idToken.payload['cognito:username'];
        const email: string = cognitoSession.idToken.payload['email'];
        const accessToken: string = cognitoSession.idToken.jwtToken;
        const idToken: any = cognitoSession.getIdToken().getJwtToken();
        const refreshToken: string = cognitoSession.refreshToken.token;
        const name: string = cognitoSession.idToken.payload['name'];
        const phone: string = cognitoSession.idToken.payload['phone_number'];
        let locality = '';
        let region = '';
        let country = '';
        let postal_code = '';
        let street_address = '';
        if (cognitoSession.idToken.payload.address) {
            const formattedAddress = JSON.parse(cognitoSession.idToken.payload.address.formatted);
            locality = formattedAddress.locality;
            region = formattedAddress.region;
            country = formattedAddress.country;
            postal_code = formattedAddress.postal_code;
            street_address = formattedAddress.street_address;
        }

        let companyName: string, language: string, notifications: boolean, optin: boolean;
        if (cognitoSession.idToken.payload['custom:companyName']) companyName = cognitoSession.idToken.payload['custom:companyName'];
        if (cognitoSession.idToken.payload['custom:language']) language = cognitoSession.idToken.payload['custom:language'];
        notifications = (cognitoSession.idToken.payload['custom:notifications']) ? JSON.parse(cognitoSession.idToken.payload['custom:notifications']) : false;
        optin = (cognitoSession.idToken.payload['custom:optin']) ? JSON.parse(cognitoSession.idToken.payload['custom:optin']) : false;

        const userData = {
            cognitoUser: cognitoUser,
            email: email,
            accessToken: accessToken,
            idToken: idToken,
            refreshToken: refreshToken,
            name: name,
            phone: phone,
            companyName: companyName,
            address: {
                street_address: street_address,
                locality: locality,
                country: country,
                region: region,
                postal_code: postal_code
            },
            language: language,
            notifications: notifications,
            optin: optin
        };
        // console.log('user data formatted is : ' + JSON.stringify(userData));
        return userData;
    }

    /**
     * cognitoLogin
     * Connect to Cognito and retrieve usersData
     * @param userName: string
     * @param userPassword: string
     */
    async cognitoLogin(userName: string, userPassword: string): Promise<any> {

        userName = userName.toLowerCase();
        return new Promise((resolve, reject) => {

            const authenticationDetails = new AWSCognito.AuthenticationDetails({
                Username: userName,
                Password: userPassword,
            });
            const userData = {
                Username: userName,
                Pool: this.userPool
            };
            const cognitoUser = new AWSCognito.CognitoUser(userData);

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: async (result) => {
                    const dbData = await this.getUserDbData({ idToken: result.getIdToken().getJwtToken() });
                    if (!environment.production) console.log('id token + ' + result.getIdToken().getJwtToken());

                    let resultUserData: UserModel = { ...dbData, ...this.formatCognitoData(result) };
                    if (!environment.production) {
                        console.log('Cognito data:', this.formatCognitoData(result));
                        console.log('DB Data:', JSON.stringify(dbData));
                    }
                    // Assign cognito data
                    this.userService.setUserData(resultUserData).then(() => {
                        setTimeout(() => {
                            // Making sure data (token) is written before calling function
                            this.userService.updateLastConnexionTime();
                        });
                        resolve({
                            userData: resultUserData,
                            cognitoUser: cognitoUser
                        });
                    });
                },
                newPasswordRequired: (userAttr) => {
                    // This is required for users that have been created with cognito adminCreateUser
                    if (!environment.production) console.log('Cognito Account: New Password Required.');
                    resolve({
                        status: 'newPasswordRequired',
                        cognitoUser: cognitoUser,
                        userAttr: userAttr
                    });
                },
                onFailure: (err) => {
                    console.error('Error during Authentication: ', err.message);
                    reject(err);
                }
            });
        });
    }

    /**
     * Confirms the email
     * @param username: string => email
     * @param verificationCode: number/string? => confirmation code
     */
    confirmRegistration(username: string, verificationCode: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // First, obtain the cognitoUser object
            this.returnCognitoUser(username).then((cognitoUser) => {
                // Then, attempt to confirm the registration
                cognitoUser.confirmRegistration(verificationCode, false, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }, (err) => reject(err));
        });
    }

    /**
     * Resends confirmation code
     * @param cognitoUser 
     */
    resendCode(cognitoUser: AWSCognito.CognitoUser): Promise<void> {
        return new Promise((resolve, reject) => {
            cognitoUser.resendConfirmationCode((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Signs out the user and clears the stored user data
     */
    signOut(): Promise<void> {
        const userPool = this.userPool;
        const cognitoUser = userPool.getCurrentUser();
        return new Promise(async (resolve, reject) => {
            try {
                if (cognitoUser == null) {
                    reject('Error during Signout: Cognito User isn\'t authenticated');
                } else {
                    cognitoUser.signOut();
                    // cognitoUser.globalSignOut();
                    this.userService.clearUserData();
                    if (this.userService.userData$) this.userService.userData$.next(null);
                    resolve();
                }
            } catch (error) {
                throw (error);
            }
        });
    }

    /**
     * Registers a new user
     * @param email: string
     * @param password: string
     * @param name: string 
     * @param optin: boolean
     * @param utm_source?: string 
     * @param utm_medium?: string 
     * @param utm_campaign?: string 
     */
    registerUser(email: string, password: string, name: string, optin: boolean, utm_source?: string, utm_medium?: string, utm_campaign?: string): Promise<any> {

        return new Promise((resolve, reject) => {

            if (!email || !password || !name) {
                reject(new Error('Required fields are missing.'));
                return;
            } else {
                // Cognito email attribute is case-sensitive
                email = email.toLowerCase();


                const attributeList = [];
                attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'name', Value: name }));
                attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'email', Value: email }));

                const optinString = (optin) ? optin.toString() : 'false';
                const source = (utm_source) ? utm_source : '';

                if (optin) attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:optin', Value: optinString }));
                if (source) attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:source', Value: source }));

                // Signup function
                // if Pool is setup with username instead of email, must replace the email with username
                this.userPool.signUp(email, password, attributeList, null, (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const newCognitoUser = result.user;
                    if (!environment.production) console.log('Signup successful ! Username is ' + newCognitoUser.getUsername());
                    resolve(newCognitoUser);
                });
            }
        });
    }

    // ######################## Update an existing User ##########################
    updateUser(email: string, name: string, phone: string, address: AddressModel,
        notifications: boolean, optin: boolean, companyName?: string): Promise<any> {

        return new Promise((resolve, reject) => {

            /*
            if ( ((!email && !name && !phone) && (!address.country && !address.locality && !address.street_address && !address.postal_code)) || (!optin && !notifications)) {
                reject('Please fill in the required fields.');
            } */
            this.returnCognitoUser(email).then((cognitoUser) => {

                const attributeList = [];
                let newUserData: UserModel = {
                    email: email,
                    name: null,
                    phone: null,
                    address: null,
                    accessToken: null,
                    refreshToken: null,
                    companyName: null,
                    notifications: null,
                    optin: null,
                    language: null,
                    plan: null,
                    utm_source: null
                };

                if (optin) {
                    attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:optin', Value: JSON.stringify(optin) }));
                    newUserData.optin = optin;
                }

                if (notifications) {
                    attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:notifications', Value: JSON.stringify(notifications) }));
                    newUserData.notifications = notifications;
                }

                /** Updating User profile information */
                if (email && name) {
                    newUserData.name = name;
                    if (name) { attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'name', Value: name })); }
                    // Set language
                    // attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:language', Value: this.translationService.getSelectedLanguage() }));
                    // newUserData.language = this.translationService.getSelectedLanguage();
                }

                /** Updating User phone information */
                if (phone) {
                    newUserData.phone = phone;
                    if (phone) { attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'phone_number', Value: phone })); }
                }

                if (companyName) {
                    // Update companyName
                    attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:companyName', Value: companyName }));
                    newUserData.companyName = companyName;
                }

                // Updating Adress
                if (!environment.production) console.log("address =======> ", address)
                newUserData.address = address;
                const formattedAddress: string = JSON.stringify(address);
                attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'address', Value: formattedAddress }));

                // Set language
                //attributeList.push(new AWSCognito.CognitoUserAttribute({ Name: 'custom:language', Value: this.translationService.getSelectedLanguage() }));
                //newUserData.language = this.translationService.getSelectedLanguage();

                if (!environment.production) console.log("attributeList ===> ", attributeList)
                cognitoUser.updateAttributes(attributeList, (err, result) => {
                    // console.log('trying to update ..', attributeList);
                    if (err) {
                        reject(err);
                    } else {
                        if (!environment.production) console.log("newUserData ===> ", newUserData)
                        /** Updates the local stored user data after the update. Only the filled values will be updated */
                        this.userService.updateUserData(newUserData)
                            .then((updatedLocalUserData) => {
                                if (!environment.production) console.log("updatedLocalUserData  ===> ", updatedLocalUserData);
                                // localStorage.setItem('userData', JSON.stringify(updatedLocalUserData));
                                /*
                                this.userService.setUserData(updatedLocalUserData).then(data => {
                                    console.log(data);
                                }).catch(err => {
                                    console.error(err);
                                });
                                */
                                resolve(updatedLocalUserData);
                            });
                    }
                });
            }, (error) => console.error(error));
        });
    }

    /** Step 1 of the forgot password flow
     * Will send an email or an SMS upon success, depending on preferences
     * Must follow-up with the forgotPasswordChange
     */
    forgotPassword(email: string): Promise<any> {
        return new Promise((resolve, reject) => {
            email = email.toLowerCase();
            // Obtain the cognitoUser object from the supplied email
            this.returnCognitoUser(email).then((cognitoUser) => {

                // Using the obtained cognitoUser to perform the forgot password request
                cognitoUser.forgotPassword({
                    onSuccess: (data) => {
                        // successfully initiated reset password request
                        // console.log('CodeDeliveryData from forgotPassword: ' + data);
                        resolve(data);
                    },
                    onFailure: (err) => {
                        // console.log('Error during forgot password request:', err.message || JSON.stringify(err));
                        reject(err);
                    }
                });
            });
        });
    }

    /** Step 2 of the forgot password flow (after forgotPassword())
     * Allows the user to insert the code obtained, and the new desired password
     */
    forgotPasswordChange(email: string, verificationCode: string, newPassword: string): Promise<any> {
        email = email.toLowerCase();
        // First, obtain the cognitoUser object from the supplied email
        const cognitoUser = new AWSCognito.CognitoUser({
            Username: email,
            Pool: this.userPool
        });

        return new Promise((resolve, reject) => {
            cognitoUser.confirmPassword(verificationCode, newPassword, {
                onFailure(err) {
                    reject(err);
                },
                onSuccess() {
                    resolve();
                },
            });
        });
    }

    /**
     * getUserDbData
     * Retrieve UserData that stored in DynamoDb
     * @param resultUserData 
     */
    async getUserDbData(resultUserData) {
        return this.userService.getUserByEmail(resultUserData).toPromise();
    }

    // Check if session is declared, returns true if it is, renews if expired and returns true, otherwise returns error with 'not_logged_in'
    checkSessionAndRenew(forceRefresh?: boolean): Promise<any> {
        if (!environment.production) console.log('Checking session...');
        const userPool = this.userPool;
        const cognitoUser = userPool.getCurrentUser();

        return new Promise((resolve, reject) => {
            if (cognitoUser == null || cognitoUser === undefined) {
                reject('not_logged_in');
            } else {
                cognitoUser.getSession((err, session) => {
                    if (err) {
                        console.log('Session issue detected');
                        const errorMessage = (err.message) ? err.message : JSON.stringify(err);
                        reject(errorMessage);
                    } else {
                        // Updating App State with user data
                        const resultUserData: UserModel = this.formatCognitoData(session);
                        // this.userService.setUserData(resultUserData);
                        if (!environment.production) console.log('Checking session, session found. Expiration timer: ' + session.accessToken.payload.exp);
                        const sessionExpirationTimeSecs = session.accessToken.payload.exp;
                        const timeNowSecs = Math.round(Date.now() / 1000) + 2400;// adding 5 min for precaution + 1800; // + 600
                        // console.log(JSON.stringify(session));
                        if (!environment.production) {
                            console.log('timenowsecs ', timeNowSecs);
                            console.log('sessionexpiration ', sessionExpirationTimeSecs);
                        }

                        // Check if token has expired or will expire within 10 minutes, in which case renew it
                        if (sessionExpirationTimeSecs <= timeNowSecs || forceRefresh == true) {
                            const refreshToken = session.refreshToken.token;
                            console.log('Renewing session token...');
                            this.renew(refreshToken)
                                .then((res: refreshTokenResult) => {
                                    // Updating Access token and Refresh token on this.userService.getUserData().idToken
                                    let userData = this.userService.getUserData();
                                    userData.idToken = res.id_token;
                                    userData.refreshToken = res.refresh_token;
                                    userData.accessToken = res.access_token;
                                    this.userService.setUserData(userData).then(() => {
                                        if (!environment.production) console.log('Updating renewed user data to ', userData);
                                        resolve();
                                    });
                                    /*
                                    console.log('logging-in with new session ', res);
                                    this.loginWithSession(res).then((res) => {
                                        // Now update the data on userData localstorage as well
                                        this.userService.setUserData(userData).then(() => {
                                            if (!environment.production) console.log('Updating renewed user data to ', userData);
                                            resolve();
                                        });
                                }).catch((err) => {
                                    reject(err);
                                });
                                */

                                }).catch((err) => {
                                    reject((err.message) ? err.message : err);
                                });
                        } else {
                            // Otherwise, session is OK and not expiring, so say that it is OK.
                            if (!environment.production) console.log('Session expires in ' + (sessionExpirationTimeSecs - timeNowSecs));
                            resolve();
                        }
                    }
                });
            }
        });
    }

    /**
     * This function is required to make other functions work
     * @param email: string
     */
    returnCognitoUser(email: string): Promise<AWSCognito.CognitoUser> {
        return new Promise((resolve, reject) => {
            email = email.toLowerCase();
            const userPool = new AWSCognito.CognitoUserPool(this.poolData);
            let cognitoUser: AWSCognito.CognitoUser = userPool.getCurrentUser();
            if (cognitoUser != null) {
                cognitoUser.getSession(function (err, session) {
                    if (err) {
                        reject(err);
                    }
                });
                resolve(cognitoUser);
            }
            else {
                const userData = {
                    Username: email,
                    Pool: this.userPool,
                };
                resolve(new AWSCognito.CognitoUser(userData));
            }
        });
    }

    /**
     * Returns Current Cognito Session
     */
    returnCognitoSession(): Promise<CognitoSession> {
        return new Promise((resolve, reject) => {
            // const userPool = this.userPool;
            let cognitoUser: AWSCognito.CognitoUser = this.userPool.getCurrentUser();
            if (cognitoUser != null) {
                cognitoUser.getSession(function (err, session) {
                    if (session.isValid()) {
                        if (!environment.production) console.log('Login with session succeeded: ', session);
                        resolve(session);
                    } else {
                        // Invalid session
                        console.error('Error while attempting to login with your session.');
                        reject(err);
                    }
                });
            } else {
                reject();
            }
        });
    }

    /**
     * Returns Session and cognito data for federated user from Facebook (or Google) 
     */
    exchangeAuthorizationCode(authorizationCode: string): Observable<CognitoFederatedIdentity> {
        const baseUrl = environment.APIBaseUrl;
        const url = baseUrl + 'authorization/' + authorizationCode;
        const httpOptions = {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
            })
        };
        return this.http.get<CognitoFederatedIdentity>(url, httpOptions);
    }

    /**
     * Logs in user with the session data from exchangeAuthorizationCode function above
     * Doesn't require a password
     * @param federatedSession: CognitoFederatedIdentity
     */
    loginWithSession(federatedSession: CognitoFederatedIdentity): Promise<CognitoSession> {
        return new Promise((resolve, reject) => {
            console.log('Federated session is', federatedSession);
            const idToken = new AWSCognito.CognitoIdToken({ IdToken: federatedSession.id_token });
            const accessToken = new AWSCognito.CognitoAccessToken({ AccessToken: federatedSession.access_token });
            const refreshToken = new AWSCognito.CognitoRefreshToken({ RefreshToken: federatedSession.refresh_token });

            const sessionData = {
                IdToken: idToken,
                AccessToken: accessToken,
                RefreshToken: refreshToken
            }
            const email = federatedSession.email;

            /*
            // using cognitoUser.setSignInUserSession and cognitoUser.getSession don't work, so I'm trying to set the session manually 
            const keyPrefix = `CognitoIdentityServiceProvider.${this.userPool.getClientId()}.${email}`;
            const idTokenKey = `${keyPrefix}.idToken`;
            const accessTokenKey = `${keyPrefix}.accessToken`;
            const refreshTokenKey = `${keyPrefix}.refreshToken`;
            const lastUserKey = `${keyPrefix}.LastAuthUser`;
    
            const storage = window.localStorage;
    
            storage.setItem(idTokenKey, idTokenKey);
            storage.setItem(accessTokenKey, accessTokenKey);
            storage.setItem(refreshTokenKey, refreshTokenKey);
            storage.setItem(lastUserKey, email);
            */

            const userSession = new AWSCognito.CognitoUserSession(sessionData);

            const userData = {
                Username: email,
                Pool: this.userPool
            };

            const cognitoUser = new AWSCognito.CognitoUser(userData);
            cognitoUser.setSignInUserSession(userSession);

            cognitoUser.getSession(function (err, session: CognitoSession) {
                // Verifyting that session is valid internally
                if (session.isValid()) {
                    if (!environment.production) console.log('FB Login with session succeeded: ', session);
                    resolve(session);
                } else {
                    // Invalid session
                    console.error('Error while attempting to login with your session.');
                    reject(err);
                }
            });
        });
    }

    /**
     * Initializes the Token to be used for the Authorization header of http requests
     */
    returnAuthorizedHttpHeaders(): Promise<Object> {
        return new Promise(async (resolve, reject) => {
            try {
                let idToken;
                const cognitoSession: CognitoSession = await this.returnCognitoSession();
                if (!environment.production) console.log('Initializing token at risk service: ', cognitoSession);
                /** For some reason, when user logs in with Federated identity (facebook) only accessToken works
                 * The opposite is true for Cognito users, they need to use the idToken
                    **/
                if (cognitoSession.accessToken.payload['cognito:username']) {
                    // Using Facebook accesstoken
                    if (cognitoSession.accessToken.payload['cognito:username'].includes('Facebook')) {
                        idToken = cognitoSession.accessToken.jwtToken;
                        if (!environment.production) console.log('Using accessToken: ', idToken);
                    }
                } else if (cognitoSession.idToken.jwtToken) {
                    // Using Cognito accessToken
                    idToken = cognitoSession.idToken.jwtToken;
                    if (!environment.production) console.log('Using idToken: ', idToken);
                } else {
                    if (!this.userService.getUserData().idToken) reject('No token was found.');
                    idToken = this.userService.getUserData().idToken;
                    console.log('Using userdata token: ', idToken);
                }
                // console.log('attempting with session ', cognitoSession.idToken.jwtToken);
                const httpOptions = {
                    headers: new HttpHeaders({
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + idToken
                    })
                };
                resolve(httpOptions);
            } catch (err) {
                reject(err);
            }
        });
    }

    returnCurrentIdToken() : Promise<any> {
        const cognitoUser = this.userPool.getCurrentUser();
        return new Promise((resolve, reject) => {
            cognitoUser.getSession(async (err, session) => {
                if (!session.isValid()) {
                    if (!environment.production) console.log('http interceptor: session is not valid : ', session.refreshToken.token);
                    const newSession = await this.renew(session.refreshToken.token);
                    //if (isFacebook) resolve(newSession.access_token);
                    //else resolve(newSession.id_token);
                    resolve(newSession.id_token);
                } else {
                    if (!environment.production) console.log('http interceptor: session is valid', session);
                    // if (isFacebook) resolve (session.accessToken.jwtToken)
                    // else resolve(session.idToken.jwtToken);
                    resolve(session.idToken.jwtToken);
                }
            });
        })
    }

}