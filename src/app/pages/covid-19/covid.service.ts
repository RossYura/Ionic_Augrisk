import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CovidDataModel } from './covid.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CovidService {

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
    })
  };

  constructor(private http: HttpClient) { }

  getCovid19InfosByCountyId(countyId: string): Observable<CovidDataModel> {
    if (!countyId) {
      console.warn('No county was specified');
      return;
    }

    return this.http.get<CovidDataModel>(environment.covidEndpoint + countyId, this.httpOptions);
  }

}
