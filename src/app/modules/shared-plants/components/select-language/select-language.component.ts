import { Component, OnInit } from '@angular/core';

import { DownloadReportService } from '@data/services/download-report.service';

@Component({
  selector: 'app-select-language',
  templateUrl: './select-language.component.html',
  styleUrls: ['./select-language.component.css'],
})
export class SelectLanguageComponent implements OnInit {
  englishSelected = false;

  constructor(public downloadReportService: DownloadReportService) {}

  ngOnInit(): void {
    this.downloadReportService.englishLang$.subscribe((englishLang) => {
      this.englishSelected = englishLang;
    });
  }
}
