import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-warnings-menu',
  templateUrl: './warnings-menu.component.html',
  styleUrls: ['./warnings-menu.component.css']
})
export class WarningsMenuComponent implements OnInit {
  warnings = ['Warning 1', 'Warning 2'];

  constructor() { }

  ngOnInit(): void {
  }

}
