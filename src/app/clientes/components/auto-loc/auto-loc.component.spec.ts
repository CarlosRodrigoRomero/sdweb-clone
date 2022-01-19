import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutoLocComponent } from './auto-loc.component';

xdescribe('AutoLocComponent', () => {
    let component: AutoLocComponent;
    let fixture: ComponentFixture<AutoLocComponent>;

    beforeEach(waitForAsync(() => {
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