import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PubliclayoutComponent } from './publiclayout.component';

xdescribe('PubliclayoutComponent', () => {
    let component: PubliclayoutComponent;
    let fixture: ComponentFixture<PubliclayoutComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PubliclayoutComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PubliclayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});