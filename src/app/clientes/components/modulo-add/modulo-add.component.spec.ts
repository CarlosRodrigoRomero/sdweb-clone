import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModuloAddComponent } from './modulo-add.component';

xdescribe('ModuloAddComponent', () => {
    let component: ModuloAddComponent;
    let fixture: ComponentFixture<ModuloAddComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ModuloAddComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ModuloAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});