import { Component, OnInit } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { ClustersService } from '@data/services/clusters.service';

@Component({
  selector: 'app-image-point-cluster',
  templateUrl: './image-point-cluster.component.html',
  styleUrls: ['./image-point-cluster.component.css'],
})
export class ImagePointClusterComponent implements OnInit {
  urlImageThumbnail: string;

  constructor(private clustersService: ClustersService, private storage: AngularFireStorage) {}

  ngOnInit(): void {
    this.clustersService.urlImageThumbnail$.subscribe((url) => (this.urlImageThumbnail = url));
  }
}
