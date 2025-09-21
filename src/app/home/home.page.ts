import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon,  IonToolbar, IonHeader, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonTitle, IonHeader, IonContent, IonButton, IonIcon, IonToolbar, CommonModule, FormsModule],
})
export class HomePage {
  constructor() {}

  goToNewRequest() {
    // Navigate to the New Request page
    window.location.href = '/tabs/new-request';
  }
}
