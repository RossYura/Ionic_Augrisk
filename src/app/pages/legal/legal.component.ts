import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'legal',
  templateUrl: './legal.component.html',
  styleUrls: ['./legal.component.scss'],
})
export class LegalComponent implements OnInit {

  public currentPage = 'terms';
  constructor(private _location: Location) { }

  ngOnInit() {}

  goBack() {
		this._location.back();
	}

  segmentChanged(e): void {
    this.currentPage = e.detail.value;
  }

}
