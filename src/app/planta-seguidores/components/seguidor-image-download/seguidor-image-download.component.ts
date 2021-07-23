import { Component, OnInit } from '@angular/core';

import { SeguidorService } from '@core/services/seguidor.service';
import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-image-download',
  templateUrl: './seguidor-image-download.component.html',
  styleUrls: ['./seguidor-image-download.component.css'],
})
export class SeguidorImageDownloadComponent implements OnInit {
  constructor(private seguidorService: SeguidorService, private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {}

  downloadRjpg() {
    this.seguidorService.downloadImage('jpg', this.seguidoresControlService.seguidorSelected);
  }

  downloadJpgVisual() {
    this.seguidorService.downloadImage('jpgVisual', this.seguidoresControlService.seguidorSelected);
  }
}
