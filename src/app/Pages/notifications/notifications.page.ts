import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { Notification } from 'src/app/Models';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit {
  notifications = [
    {
      icon: 'create-outline',
      color: '#4d5ef2',
      title: 'Statut de la réparation mis à jour',
      message: 'Votre réparation d\'iPhone 13 (REQ#10045) est maintenant en cours. Date d\'achèvement estimée : 2 jours.',
      time: '5m ago',
      unread: true
    },
    {
      icon: 'alert-circle-outline',
      color: '#ff3b30',
      title: 'Avis important concernant le compte',
      message: 'Veuillez vérifier vos informations de contact pour garantir une communication fluide concernant vos réparations.',
      time: '30m',
      unread: true
    },
    {
      icon: 'chatbubble-ellipses-outline',
      color: '#ffb300',
      title: 'Nouveau message du technicien',
      message: 'Le technicien a envoyé un message concernant la réparation de votre MacBook Pro. Vérifiez les détails maintenant.',
      time: '2h',
      unread: true
    },
    {
      icon: 'checkmark-circle-outline',
      color: '#232323',
      title: 'Réparation terminée !',
      message: 'Votre réparation de Samsung S21 (REQ#10038) est maintenant terminée et prête à être récupérée.',
      time: '1d',
      unread: false
    },
    {
      icon: 'document-outline',
      color: '#232323',
      title: 'Demande reçue',
      message: 'Votre nouvelle demande de réparation pour un PC de bureau a été soumise avec succès. REQ#10046.',
      time: '2d',
      unread: false
    },
    {
      icon: 'create-outline',
      color: '#4d5ef2',
      title: 'Pièce commandée pour réparation',
      message: 'Un écran de remplacement a été commandé pour la réparation de votre iPad Air 4. Les détails de suivi seront disponibles bientôt.',
      time: '3d',
      unread: false
    },
    {
      icon: 'alert-circle-outline',
      color: '#ff3b30',
      title: 'Interruption de service',
      message: 'Certains services peuvent être temporairement indisponibles en raison de travaux de maintenance planifiés. Nous nous excusons pour tout inconvénient.',
      time: '5d',
      unread: false
    }
  ];

  constructor() { }

  ngOnInit() {
    

  }

  markAsRead(slidingItem: IonItemSliding, notification: any) {
    notification.unread = false;
    // Recharger la liste pour mettre à jour l'affichage
    slidingItem.close();
   
  }

  deleteNotification(slidingItem: IonItemSliding, notification: any) {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      slidingItem.close();
    }
  }

}
