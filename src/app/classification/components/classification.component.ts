import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { ClassificationService } from '@core/services/classification.service';
import { ClustersService } from '@core/services/clusters.service';

import { NormalizedModule } from '@core/models/normalizedModule';


@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css'],
})
export class ClassificationComponent implements OnInit {
  serviceInit = false;
  nombrePlanta: string;
  normModHovered: NormalizedModule = undefined;

  constructor(private classificationService: ClassificationService, private clustersService: ClustersService) {}

  ngOnInit(): void {
    this.classificationService.initService().subscribe((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod));

    // lo iniciamos para poder acceder a la info de la trayectoria del vuelo
    this.clustersService.initService().pipe(take(1)).subscribe();
  }
}
