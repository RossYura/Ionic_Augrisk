import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
})
export class ErrorComponent implements OnInit {

  public errorCode: number;
  public errorMessage: string;

  constructor(private _location: Location, private route: ActivatedRoute) { 
    this.route.params.subscribe( (res) => {
      this.errorCode = res.errorCode;
      this.errorMessage = res.errorMessage;
    })
  }

  ngOnInit() {}
  
  goBack() {
		this._location.back();
	}

}
