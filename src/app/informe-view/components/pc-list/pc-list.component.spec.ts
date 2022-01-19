import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PcListComponent } from './pc-list.component';

xdescribe('PcListComponent', () => {
    let component: PcListComponent;
    let fixture: ComponentFixture<PcListComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PcListComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PcListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});