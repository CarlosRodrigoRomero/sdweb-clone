import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantasTableComponent } from './plantas-table.component';

describe('PlantasTableComponent', () => {
  let component: PlantasTableComponent;
  let fixture: ComponentFixture<PlantasTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlantasTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantasTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
