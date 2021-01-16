import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioBenchmarkComponent } from './portfolio-benchmark.component';

describe('PortfolioBenchmarkComponent', () => {
  let component: PortfolioBenchmarkComponent;
  let fixture: ComponentFixture<PortfolioBenchmarkComponent>;

  beforeEach(async(() => {
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
