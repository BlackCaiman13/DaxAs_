import { Component } from '@angular/core';
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
export class RequestConfirmedPage {
  requestId = 'RF-2024-5678';
  estimatedDelivery = '3-5 business days';
  diagnosticFee = 50.00;
  estimatedPartsFee = { min: 150.00, max: 300.00 };

  constructor(private router: Router) {}

  trackRequest() {
    this.router.navigate(['/tabs/requests']);
  }
}
