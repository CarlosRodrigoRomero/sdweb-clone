import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantaEditComponent } from './planta-edit.component';

xdescribe('PlantaEditComponent', () => {
    let component: PlantaEditComponent;
    let fixture: ComponentFixture<PlantaEditComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PlantaEditComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlantaEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});