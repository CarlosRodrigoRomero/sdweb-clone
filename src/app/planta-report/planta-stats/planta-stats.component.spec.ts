import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantaStatsComponent } from './planta-stats.component';

describe('PlantaStatsComponent', () => {
  let component: PlantaStatsComponent;
  let fixture: ComponentFixture<PlantaStatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlantaStatsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantaStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
