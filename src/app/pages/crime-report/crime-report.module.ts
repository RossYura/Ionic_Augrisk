import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { CrimeReportComponent } from './crime-report/crime-report.component';
import { CrimeService } from './crime.service';
import { IonicModule } from '@ionic/angular';


const routes: Routes = [
	{
		path: "",
    component: CrimeReportComponent
  }
];

@NgModule({
  declarations: [CrimeReportComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule
  ],
  exports: [RouterModule],
  providers: [CrimeService],
  entryComponents: [CrimeReportComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class CrimeReportModule { }
