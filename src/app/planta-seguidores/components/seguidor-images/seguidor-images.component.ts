import { Component, OnInit } from '@angular/core';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-images',
  templateUrl: './seguidor-images.component.html',
  styleUrls: ['./seguidor-images.component.css'],
})
export class SeguidorImagesComponent implements OnInit {
  public urlImageSeguidor: string;

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {
    this.seguidoresControlService.urlImageVisualSeguidor$.subscribe((url) => {
      this.urlImageSeguidor = url;
    });
  }
}
