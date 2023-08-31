import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiCallsService {
  private urlCalcAnomData = 'https://datos-anomalia-rcpywurt6q-ew.a.run.app';
  private urlAddPcDataToAnoms = 'https://anomalias-to-pcs-rcpywurt6q-ew.a.run.app/anomalias-to-pcs';
  private urlAddDateToAnoms = 'https://europe-west1-sdweb-d33ce.cloudfunctions.net/fecha-anomalias';

  constructor(private http: HttpClient) {}

  addDateToAnoms(informeId: string) {
    const params = new HttpParams().set('informeId', informeId);

    return this.http
      .get(this.urlAddDateToAnoms, { responseType: 'text', params })
      .toPromise()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
