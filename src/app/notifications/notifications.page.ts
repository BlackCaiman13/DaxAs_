import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonList, IonItem, IonLabel, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit {
  notifications = [
    {
      icon: 'create-outline',
      color: '#4d5ef2',
      title: 'Repair Status Update',
      message: 'Your iPhone 13 repair (REQ#10045) is now in progress. Estimated completion: 2 days.',
      time: '5m ago',
      unread: true
    },
    {
      icon: 'alert-circle-outline',
      color: '#ff3b30',
      title: 'Important Account Notice',
      message: 'Please verify your contact information to ensure smooth communication regarding your repairs.',
      time: '30m ago',
      unread: true
    },
    {
      icon: 'chatbubble-ellipses-outline',
      color: '#ffb300',
      title: 'New Message from Technician',
      message: 'Technician has sent a message regarding your MacBook Pro repair. Check details now.',
      time: '2h ago',
      unread: true
    },
    {
      icon: 'checkmark-circle-outline',
      color: '#232323',
      title: 'Repair Completed!',
      message: 'Your Samsung S21 repair (REQ#10038) is now complete and ready for pickup.',
      time: '1d ago',
      unread: false
    },
    {
      icon: 'document-outline',
      color: '#232323',
      title: 'Request Received',
      message: 'Your new repair request for a desktop PC has been successfully submitted. REQ#10046.',
      time: '2d ago',
      unread: false
    },
    {
      icon: 'create-outline',
      color: '#4d5ef2',
      title: 'Part Ordered for Repair',
      message: 'A replacement screen has been ordered for your iPad Air 4 repair. Tracking details available soon.',
      time: '3d ago',
      unread: false
    },
    {
      icon: 'alert-circle-outline',
      color: '#ff3b30',
      title: 'Service Interruption',
      message: 'Some services may be temporarily unavailable due to scheduled maintenance. We apologize for any inconvenience.',
      time: '5d ago',
      unread: false
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
