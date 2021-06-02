import { Component, OnInit } from '@angular/core';
import { NormalizedModule } from '@core/models/normalizedModule';

import { ClassificationService } from '@core/services/classification.service';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css'],
})
export class ClassificationComponent implements OnInit {
  serviceInit = false;
  nombrePlanta: string;
  normModHovered: NormalizedModule = undefined;

  constructor(private classificationService: ClassificationService) {}

  ngOnInit(): void {
    this.classificationService.initService().subscribe((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
    this.classificationService.normModHovered$.subscribe((normMod) => (this.normModHovered = normMod));
  }
}
