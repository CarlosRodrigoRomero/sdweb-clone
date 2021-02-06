import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSankeyComponent } from './chart-sankey.component';

describe('ChartSankeyComponent', () => {
  let component: ChartSankeyComponent;
  let fixture: ComponentFixture<ChartSankeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartSankeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartSankeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
