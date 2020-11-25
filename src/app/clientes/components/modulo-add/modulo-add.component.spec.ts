import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloAddComponent } from './modulo-add.component';

describe('ModuloAddComponent', () => {
    let component: ModuloAddComponent;
    let fixture: ComponentFixture<ModuloAddComponent>;

    beforeEach(async(() => {
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