import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-right-menu',
  templateUrl: './right-menu.component.html',
  styleUrls: ['./right-menu.component.css'],
})
export class RightMenuComponent implements OnInit {
  menuOpen = false;
  @Input() isShared: boolean;
  @Input() isAdmin: boolean;
  @Output() signOut = new EventEmitter();
  @Output() newBug = new EventEmitter();
  @Output() goGrafana = new EventEmitter();
  @Output() goHelp = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}
}
