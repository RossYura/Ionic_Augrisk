import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'air-pollution-details',
  templateUrl: './air-pollution-details.component.html',
})
export class AirPollutionDetailsComponent implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss();
  }

}
