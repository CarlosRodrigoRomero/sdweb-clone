import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoLocComponent } from './auto-loc.component';

describe('AutoLocComponent', () => {
    let component: AutoLocComponent;
    let fixture: ComponentFixture<AutoLocComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AutoLocComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AutoLocComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});