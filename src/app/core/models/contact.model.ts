export interface ContactModel {
	name?: string;
	phone?: any;
	contactType?: string;
	subjectToStaff?: string;
	subjectToUser?: string;
	messageToStaff?: string;
	messageToUser?: string;
	sendToUser?: string;
	sendToStaff?: number | Array<number> | Array<string> | string;
}
