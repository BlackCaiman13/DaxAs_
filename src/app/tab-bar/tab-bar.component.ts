import { Component, OnInit } from '@angular/core';
import { IonTabBar, IonTabButton, IonTabs, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, IonTabBar, IonTabButton, IonTabs, IonLabel],
})
export class TabBarComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
