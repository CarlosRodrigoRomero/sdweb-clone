import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay()
  );

  id: string;
  showNavbar = true;

  constructor(private breakpointObserver: BreakpointObserver, private router: Router) {}

  ngOnInit() {}

  navigateTo(page: string) {
    const url = this.router.url.split('/');
    url[url.length - 1] = page;
    this.router.navigate(url);
  }
}
