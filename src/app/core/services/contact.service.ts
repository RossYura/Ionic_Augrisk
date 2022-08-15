import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
// Models
import { ContactModel } from "../models/contact.model";
import { UserService } from "./user.service";
import { UserModel } from "../models/user.model";

@Injectable({
	providedIn: "root"
})
export class ContactService {
	APIContactURL = environment.APIBaseUrl + "sendMail";
	userData: UserModel;
	userEmail: string;
	userName: string;
	userToken: string;
	httpOptions: {};

	constructor(
		private http: HttpClient,
		private userService: UserService
	) {
		this.initializeToken();
		this.userData = this.userService.getUserData();
	}

	/**
	 * initializeToken
	 * Set headers and token on httpOptions
	 */
	initializeToken(): void {
		if (!this.userToken || !this.userEmail || !this.userName) {
			this.userToken = this.userService.getUserData().idToken;
			this.userEmail = this.userService.getUserData().email;
			this.userName = this.userService.getUserData().name;
		}
		this.httpOptions = {
			headers: new HttpHeaders({
				"Content-Type": "application/json",
				Authorization: "Bearer " + this.userToken
			})
		};
	}

	/**
	 * sendMail
	 * Send an email using sendMail API endpoint
	 * @param message: string => We only ask for message because we already know user name & email
	 */
	public sendMail(message: string): Observable<any> {

		if (!this.userEmail || !this.userName){
			throw new Error('Unexpected Error: User data not initialized.');
		}
		
		let contactData: ContactModel = {
			contactType: "private-contact",
			subjectToStaff: 'Message from Augurisk-now',
			subjectToUser: "Thanks for contacting Augurisk",
			messageToStaff: JSON.stringify(`Contact message from: ${this.userName} (${this.userEmail}):<br/> ${message}`),
			messageToUser: "Hello, <br/> thanks for contact us. We have successfully received your message on Augurisk now, and will revert back to you ASAP. <br/>The Augurisk team", // this is not sent to the user currently
			sendToUser: this.userEmail,
			name: this.userName,
			sendToStaff: [1]
		};

		if (!environment.production) console.log('Contact data is', contactData);
		// Our api doesn't send a message to the user anymore, so messageToUser and SubjectToUser are irrelevant ATM

		return this.http.post<any>(
			this.APIContactURL,
			contactData,
			this.httpOptions
		);
	}


}
