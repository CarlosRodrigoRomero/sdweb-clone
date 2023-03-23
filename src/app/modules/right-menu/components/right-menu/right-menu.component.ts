import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-right-menu',
  templateUrl: './right-menu.component.html',
  styleUrls: ['./right-menu.component.css'],
})
export class RightMenuComponent implements OnInit {
  @Input() isShared: boolean;
  @Input() isAdmin: boolean;
  @Output() signOut = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}
}
