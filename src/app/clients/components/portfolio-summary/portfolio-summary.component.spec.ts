import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioControlService } from '@core/services/portfolio-control.service';
import { PortfolioSummaryComponent } from './portfolio-summary.component';

describe('PortfolioSummaryComponent', () => {
  let component: PortfolioSummaryComponent;
  let fixture: ComponentFixture<PortfolioSummaryComponent>;
  // let portfolioControlService: PortfolioControlService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioSummaryComponent],
      providers: [PortfolioControlService],
    }).compileComponents();
    // portfolioControlService = TestBed.inject(PortfolioControlService);
  });

  it('PortfolioSummaryComponent es creado', () => {
    expect(component).toBeTruthy();
  });
});
