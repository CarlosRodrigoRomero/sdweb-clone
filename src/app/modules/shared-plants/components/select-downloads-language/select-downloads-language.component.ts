import { Component, OnInit } from '@angular/core';

import { DownloadReportService } from '@data/services/download-report.service';

@Component({
  selector: 'app-select-downloads-language',
  templateUrl: './select-downloads-language.component.html',
  styleUrls: ['./select-downloads-language.component.css'],
})
export class SelectDownloadsLanguageComponent implements OnInit {
  englishSelected = false;

  constructor(public downloadReportService: DownloadReportService) {}

  ngOnInit(): void {
    this.downloadReportService.englishLang$.subscribe((englishLang) => {
      this.englishSelected = englishLang;
    });
  }
}
