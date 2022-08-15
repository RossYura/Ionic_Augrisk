import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { CovidComponent } from './covid/covid.component';
import { CovidService } from './covid.service';
import { IonicModule } from '@ionic/angular';


const routes: Routes = [
	{
		path: "",
    component: CovidComponent
  }
];

@NgModule({
  declarations: [CovidComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule,
  ],
  exports: [RouterModule],
  providers: [CovidService],
  entryComponents: [CovidComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class Covid19Module { }
