export interface AddressModel {
	street_address?: string;
	region?: string;
	postal_code?: string;
	locality: string;
	country: string;
}

export interface UserModel {
	createdAt?: number;
	cognitoUser?: string;
	email?: string;
	name?: string;
	companyName?: string;
	phone?: string;
	address?: AddressModel;
	notifications?: boolean;
	optin?: boolean;
	language?: string; // Not implemented yet
	subscription?: string;
	subscriptionDate?: 0;
	creditsRemaining?: 0;
	stripeCustomerId?: string;
	plan?: any; // this is the plan chosen during registration, useful for first login
	lastCreditsUpdate?: any;
	planAnniversary?: Date;
	apiSecretKey?: string;
	selectedProject?: string;
	selectedProjectId?: string;
	usedFree?: boolean;
	signupPlan?: string;
	utm_source?: string;
	// Cognito tokens
	accessToken?: string;
	idToken?: any;
	refreshToken?: string;
	// Useless things probably to delete in the near future
	authTime?: number;
	aud?: string;
	eventId?: string;
	exp?: number;
	iat?: number;
	// User Management Variables
	hasChildAccounts?: boolean;
	parentAccount?: string;
	lastConnexion?: number;
	active?: boolean;
}

export interface UserPreferences {
	crimeActive: boolean;
	floodActive: boolean;
	earthquakeActive: boolean;
	stormActive: boolean;
	nuclearActive: boolean;
	wildfiresActive: boolean;
	airQualityActive: boolean;
	notifications?: 'all' | 'highThreats' | 'disabled';
	disabled: boolean;
	darkMode?: boolean;
}