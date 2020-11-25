import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPcDetailComponent } from './edit-pc-detail.component';

describe('EditPcDetailComponent', () => {
    let component: EditPcDetailComponent;
    let fixture: ComponentFixture<EditPcDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EditPcDetailComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditPcDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});