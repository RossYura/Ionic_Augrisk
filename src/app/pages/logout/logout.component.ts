import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CognitoService } from 'src/app/core/services/cognito.service';

@Component({
  selector: 'logout',
  templateUrl: './logout.component.html'
})
export class LogoutComponent {

  constructor(
    private cognitoService: CognitoService,
    private router: Router
  ) {
    // Immediately perform logout and redirect the user to the login page
    this.cognitoService.signOut().then(
      res => {
        localStorage.clear();
        location.reload();
        // Signout was successful, redirecting to the login page
        console.log("Signout successful, redirecting to login page...");
        this.router.navigate(["/auth/login"]);
      },
      err => {
        this.router.navigate(["/pages/error/400"]);
        console.error(
          "Logout Error during signout, redirecting to error page..."
        );
        throw err;
      }
    );
  }


}
