import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantaAddComponent } from './planta-add.component';

xdescribe('PlantaAddComponent', () => {
    let component: PlantaAddComponent;
    let fixture: ComponentFixture<PlantaAddComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlantaAddComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlantaAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});