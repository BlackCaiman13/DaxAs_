import { Component, OnInit } from '@angular/core';
import { IonTabBar, IonTabButton, IonTabs, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  standalone: true,
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs],
})
export class TabBarComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
