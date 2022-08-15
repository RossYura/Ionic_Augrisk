import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'risk-assessment',
  templateUrl: './risk-assessment.component.html',
  styleUrls: ['./risk-assessment.component.scss'],
})
export class RiskAssessmentComponent implements OnInit {

  constructor(private _location: Location) { }

  ngOnInit() {}

  openAuguriskApp(): void {
    // This should include the one login link
    window.open("https://app.augurisk.com");
  }

  goBack() {
    this._location.back();
  }

}
