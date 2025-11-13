import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-request-confirmed',
  templateUrl: './request-confirmed.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon
  ]
})
export class RequestConfirmedPage implements OnInit {
  requestId: string = '';
  estimatedDelivery = '3-5 jours ouvrables';
  diagnosticFee = 50.00;
  estimatedPartsFee = { min: 150.00, max: 300.00 };

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state && state['requestId']) {
      this.requestId = `RF-${state['requestId']}`;
    }
  }

  ngOnInit() {
    if (!this.requestId) {
      this.router.navigate(['/tabs/home']);
    }
  }

  trackRequest() {
    this.router.navigate(['/tabs/request']);
  }
}
