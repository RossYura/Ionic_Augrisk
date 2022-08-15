import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'earthquake-details',
  templateUrl: './earthquake-details.component.html',
})
export class EarthquakeDetailsComponent implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss();
  }


}
