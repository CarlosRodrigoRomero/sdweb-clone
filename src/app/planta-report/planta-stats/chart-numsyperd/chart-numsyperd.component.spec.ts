import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartNumsyperdComponent } from './chart-numsyperd.component';

describe('ChartNumsyperdComponent', () => {
  let component: ChartNumsyperdComponent;
  let fixture: ComponentFixture<ChartNumsyperdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartNumsyperdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartNumsyperdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
