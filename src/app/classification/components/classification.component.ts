import { Component, OnInit } from '@angular/core';

import { ClassificationService } from '@core/services/classification.service';

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.css'],
})
export class ClassificationComponent implements OnInit {
  serviceInit = false;
  nombrePlanta: string;

  constructor(private classificationService: ClassificationService) {}

  ngOnInit(): void {
    this.classificationService.initService().subscribe((value) => (this.serviceInit = value));
    this.classificationService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre));
  }
}
