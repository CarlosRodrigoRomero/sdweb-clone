import { NgModuleFactoryLoader } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from './app-routing.module';
import { AppRoutingModule } from './app-routing.module';
import { ClientesModule } from './clientes/clientes.module';
import { IndexComponent } from './cts/index/index.component';

xdescribe('App Routing', () => {
  let component: AppRoutingModule;
  let fixture: ComponentFixture<AppRoutingModule>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppRoutingModule],
      imports: [RouterTestingModule.withRoutes(routes), BrowserAnimationsModule],
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(AppRoutingModule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should navigate to clientes child path', fakeAsync(() => {
    let router = TestBed.inject(Router);
    let location = TestBed.inject(Location);
    let fixture = TestBed.createComponent(AppRoutingModule);
    router.initialNavigation();

    let loader = TestBed.inject(NgModuleFactoryLoader);
    // loader.stubbedModules = { lazyModule: ClientesModule };

    router.resetConfig([{ path: 'clientes', loadChildren: 'lazyModule' }]);

    router.navigateByUrl('clientes/child');

    tick();
    fixture.detectChanges();

    expect(location.pathname).toBe('clientes/child');
  }));

  it('Should have "" as path', () => {
    expect(routes[0].path).toBe('');
    expect(routes[0].component).toBe(IndexComponent);
  });
});
