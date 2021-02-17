import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareMapComponent } from './share-map.component';

describe('ShareComponent', () => {
  let component: ShareMapComponent;
  let fixture: ComponentFixture<ShareMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
