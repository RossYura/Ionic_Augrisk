import { Component, OnInit } from '@angular/core';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { environment } from 'src/environments/environment';
import { Location } from '@angular/common';

@Component({
  selector: 'emergency-numbers',
  templateUrl: './emergency-numbers.component.html',
  styleUrls: ['./emergency-numbers.component.scss'],
})
export class EmergencyNumbersComponent implements OnInit {

  public show911information = false;
  public showPoliceDep: string;
  public showHospital: string;
  constructor(private callNumber: CallNumber, private _location: Location) { }

  ngOnInit() {}

  goBack() {
		this._location.back();
	}

  toggle(section?: '911' | 'police' | 'hospital') {
    if (section == '911') this.show911information = !this.show911information;
  }

  async clickToCallNumber(number: string): Promise<void>{
    if (!environment.production) console.log('Calling ' + number + '...');
    try {
      await this.callNumber.callNumber(number, true);
    } catch (err) {
      throw err;
    }
  }

}
