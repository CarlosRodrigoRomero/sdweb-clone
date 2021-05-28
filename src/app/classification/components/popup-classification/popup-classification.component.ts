import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ClassificationService } from '@core/services/classification.service';

import { NormalizedModule } from '@core/models/normalizedModule';

@Component({
  selector: 'app-popup-classification',
  templateUrl: './popup-classification.component.html',
  styleUrls: ['./popup-classification.component.css'],
})
export class PopupClassificationComponent implements OnInit {
  normModSelected: NormalizedModule;
  form = new FormGroup({});
  formControl = new FormControl(8, [Validators.min(1), Validators.max(19)]);

  constructor(private classificationService: ClassificationService) {}

  ngOnInit(): void {
    this.classificationService.normModSelected$.subscribe((normMod) => (this.normModSelected = normMod));
  }
}
