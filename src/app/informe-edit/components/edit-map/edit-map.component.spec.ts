import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditMapComponent } from './edit-map.component';

xdescribe('EditMapComponent', () => {
    let component: EditMapComponent;
    let fixture: ComponentFixture<EditMapComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [EditMapComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});