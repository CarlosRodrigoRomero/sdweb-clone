import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlantaListComponent } from './planta-list.component';

xdescribe('PlantaListComponent', () => {
    let component: PlantaListComponent;
    let fixture: ComponentFixture<PlantaListComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PlantaListComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PlantaListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});