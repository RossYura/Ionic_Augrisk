import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RiskDataModel } from './crime.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CrimeService {

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
    })
  };

  constructor(private http: HttpClient) { }

  getRiskData(projectId: string): Observable<RiskDataModel> {
    if (!projectId) {
      throw new Error('Error while getting Risk Data: no project id was provided.');
    }
    let url = environment.APIBaseUrl;
    url += 'getRisks/' + projectId;
    return this.http.get<RiskDataModel>(url, this.httpOptions);
  }

}
