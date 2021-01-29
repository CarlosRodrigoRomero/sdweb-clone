import { AfterViewInit, Component, OnInit, ViewChild, ViewChildren } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';

import { Observable } from 'rxjs';

import { FilterService } from '@core/services/filter.service';

@Component({
  selector: 'app-share-map',
  templateUrl: './share-map.component.html',
  styleUrls: ['./share-map.component.css'],
})
export class ShareMapComponent implements OnInit, AfterViewInit {
  items: Observable<any[]>;

  constructor(private firestore: AngularFirestore, private filterService: FilterService) {
    /* this.items = firestore.collection('plantas').valueChanges();
    this.items.subscribe((items) => console.log(items)); */
  }

  ngOnInit(): void {}

  ngAfterViewInit() {}

  getActiveFilters() {}

  stopPropagation(event) {
    event.stopPropagation();
  }
}
