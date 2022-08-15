import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'crime-details',
  templateUrl: './crime-details.component.html',
})
export class CrimeDetailsComponent implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  closeModal() {
    this.modalController.dismiss();
  }


}
