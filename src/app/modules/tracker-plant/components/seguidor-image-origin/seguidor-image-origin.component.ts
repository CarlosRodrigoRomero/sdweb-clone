import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ThemeService } from '@data/services/theme.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-seguidor-image-origin',
  templateUrl: './seguidor-image-origin.component.html',
  styleUrls: ['./seguidor-image-origin.component.css'],
})
export class SeguidorImageOriginComponent implements OnInit {
  private planta: PlantaInterface;
  origin = 'tL';
  theme: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;

    this.checkOrigin();

    this.loadIcons();

    this.subscriptions.add(
      this.themeService.themeSelected$.subscribe((theme) => {
        this.theme = theme.split('-')[0];
      })
    );
  }

  private checkOrigin(): void {
    if (this.planta.hasOwnProperty('columnaDchaPrimero') && this.planta.columnaDchaPrimero) {
      if (this.planta.alturaBajaPrimero) {
        this.origin = 'bR';
      } else {
        this.origin = 'tR';
      }
    } else {
      if (this.planta.alturaBajaPrimero) {
        this.origin = 'bL';
      }
    }
  }

  loadIcons(): void {
    this.matIconRegistry.addSvgIcon(
      'axis_bl_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-bL-dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_tl_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-tL-dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_tr_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-tR-dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_br_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-bR-dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_bl_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-bL-light.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_tl_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-tL-light.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_tr_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-tR-light.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'axis_br_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/axis-bR-light.svg')
    );
  }
}
