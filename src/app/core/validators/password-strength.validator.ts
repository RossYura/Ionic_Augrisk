import { AbstractControl } from '@angular/forms';

export class PasswordStrengthValidator {
	/**
	 * Check if password matches strength required by Cognito (one lower case, one upper case, one number)
	 * @param control AbstractControl
	 */
	static PasswordStrength(control: AbstractControl) {
		const password = control.get('password').value;

		let hasLower = false;
		let hasUpper = false;
		let hasNum = false;

		/*
		const lowercaseRegex = new RegExp('(?=.*[a-z])'); // has at least one lower case letter
		if (lowercaseRegex.test(password)) {
			hasLower = true;
		}

		const uppercaseRegex = new RegExp('(?=.*[A-Z])'); // has at least one upper case letter
		if (uppercaseRegex.test(password)) {
			hasUpper = true;
		}*/

		const numRegex = new RegExp('(?=.*\\d)'); // has at least one number
		if (numRegex.test(password)) {
			hasNum = true;
		}

		// Check the validation

		if (hasNum = false) { //if (hasLower === false || hasUpper === false || hasNum === false) {
			control.get('password').setErrors({ PasswordStrength: true });
		} else {
			return null;
		}

	}
}
