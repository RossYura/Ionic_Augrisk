import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'wildfire-details',
  templateUrl: './wildfire-details.component.html',
})
export class WildfireDetailsComponent implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss();
  }


}
