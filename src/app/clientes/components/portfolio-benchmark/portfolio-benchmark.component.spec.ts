import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PortfolioBenchmarkComponent } from './portfolio-benchmark.component';

describe('PortfolioBenchmarkComponent', () => {
  let component: PortfolioBenchmarkComponent;
  let fixture: ComponentFixture<PortfolioBenchmarkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PortfolioBenchmarkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioBenchmarkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
