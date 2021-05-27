import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartCelsTempsComponent } from './chart-cels-temps.component';

describe('ChartCelsTempsComponent', () => {
  let component: ChartCelsTempsComponent;
  let fixture: ComponentFixture<ChartCelsTempsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartCelsTempsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartCelsTempsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
