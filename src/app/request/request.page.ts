import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonIcon, IonButton } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  styleUrls: ['./request.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonButton, CommonModule, FormsModule, RouterLink]
})
export class RequestPage implements OnInit {
  requests = [
    {
      title: 'iPhone 13 Screen Repair',
      id: 'RF789012',
      status: 'En cours',
      statusColor: '#c48a1b',
      statusTextColor: '#fff'
    },
    {
      title: 'MacBook Pro Battery Replacement',
      id: 'RF789013',
      status: '',
      statusColor: '',
      statusTextColor: ''
    },
    {
      title: 'Smartwatch Glass Repair',
      id: 'RF789014',
      status: 'En attente',
      statusColor: '#4d5ef2',
      statusTextColor: '#fff'
    },
    {
      title: 'Desktop PC Virus Removal',
      id: 'RF789015',
      status: 'annulé',
      statusColor: '#ff3b30',
      statusTextColor: '#fff'
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
