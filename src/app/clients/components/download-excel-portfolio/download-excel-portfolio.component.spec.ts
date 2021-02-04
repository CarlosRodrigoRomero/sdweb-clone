import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadExcelPortfolioComponent } from './download-excel-portfolio.component';

describe('DownloadExcelPortfolioComponent', () => {
  let component: DownloadExcelPortfolioComponent;
  let fixture: ComponentFixture<DownloadExcelPortfolioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadExcelPortfolioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadExcelPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
