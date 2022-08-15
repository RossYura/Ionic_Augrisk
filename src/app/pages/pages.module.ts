import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainComponent } from './main.component';
import { UserService } from '../core/services/user.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LogoutComponent } from './logout/logout.component';
import { BlogPostsComponent } from './blog-posts/blog-posts.component';
import { RiskAssessmentComponent } from './risk-assessment/risk-assessment.component';
import { ProfileComponent } from './profile/profile.component';
import { LegalComponent } from './legal/legal.component';
import { ContactComponent } from './contact/contact.component';
import { EmergencyNumbersComponent } from './emergency-numbers/emergency-numbers.component';
import { TrackerService } from '../core/services/tracker.service';
import { RiskService } from '../core/services/risk.service';
import { IsLoggedInGuard } from '../core/guards/is-logged-in.guard';
import { TimeAgoPipe } from '../core/pipes/time-ago.pipe';
import { AmchartsService } from '../core/services/amcharts.service';
import { AirPollutionDetailsComponent } from './modals/air-pollution-details/air-pollution-details.component';
import { HttpAuthorizationInterceptor } from '../core/interceptors/http-authorization.service';
import { ErrorComponent } from './error/error.component';
import { CrimeDetailsComponent } from './modals/crime-details/crime-details.component';
import { EarthquakeDetailsComponent } from './modals/earthquake-details/earthquake-details.component';
import { FloodDetailsComponent } from './modals/flood-details/flood-details.component';
import { NuclearDetailsComponent } from './modals/nuclear-details/nuclear-details.component';
import { StormDetailsComponent } from './modals/storm-details/storm-details.component';
import { WildfireDetailsComponent } from './modals/wildfire-details/wildfire-details.component';



const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        // canActivate: [IsLoggedInGuard], // Might not be necessary since it's already invoked on the root page module
        canActivateChild: [IsLoggedInGuard], // Might not be necessary since it's already invoked on the root page module
        children: [
            {
                path: "",
                redirectTo: "dashboard",
                pathMatch: "full"
            },
            {
                path: "dashboard",
                component: DashboardComponent
            },
            {
                path: "crime-report",
                loadChildren: () => import('./crime-report/crime-report.module').then(m => m.CrimeReportModule),
            },
            {
                path: 'coronavirus',
                loadChildren: () => import('./covid-19/covid-19.module').then(m => m.Covid19Module),
            },
            {
                path: "blog-posts",
                component: BlogPostsComponent
            },
            {
                path: "risk-assessment",
                component: RiskAssessmentComponent
            },
            {
                path: "emergency-numbers",
                component: EmergencyNumbersComponent
            },
            {
                path: "profile",
                component: ProfileComponent
            },
            {
                path: "legal",
                component: LegalComponent
            },
            {
                path: "contact",
                component: ContactComponent
            },
            {
                path: "logout",
                component: LogoutComponent
            }
        ]
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        HttpClientModule
    ],
    declarations: [DashboardComponent, ProfileComponent, MainComponent, LogoutComponent, BlogPostsComponent, LegalComponent, RiskAssessmentComponent,
        EmergencyNumbersComponent, ContactComponent, TimeAgoPipe, AirPollutionDetailsComponent, ErrorComponent, AirPollutionDetailsComponent, CrimeDetailsComponent, 
        EarthquakeDetailsComponent, FloodDetailsComponent, NuclearDetailsComponent, StormDetailsComponent, WildfireDetailsComponent],
    providers: [UserService, TrackerService, RiskService, AmchartsService, CallNumber,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpAuthorizationInterceptor,
          multi: true
        }],
        schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PagesModule { }
