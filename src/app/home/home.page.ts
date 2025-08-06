import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon,  IonToolbar, IonHeader, IonTitle,  IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [ IonTitle, IonHeader, IonContent, IonButton, IonIcon, IonToolbar, CommonModule, FormsModule, IonBadge],
})
export class HomePage {
  constructor() {}
}
