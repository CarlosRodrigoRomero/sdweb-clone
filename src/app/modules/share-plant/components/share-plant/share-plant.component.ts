import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';


@Component({
  selector: 'app-share-plant',
  templateUrl: './share-plant.component.html',
  styleUrls: ['./share-plant.component.css']
})
export class SharePlantComponent implements OnInit {

  @Input() currentPlantId: number;
  @Output() openDialog = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
