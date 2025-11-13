import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonSpinner } from '@ionic/angular/standalone';
import { Notification } from 'src/app/Models';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption, IonSpinner, CommonModule, FormsModule]
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  private notificationSubscription: any;

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadNotifications();
    await this.subscribeToNewNotifications();
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  async loadNotifications() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getUser();
      if (user) {
        this.notifications = await this.supabaseService.getNotifications(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      this.loading = false;
    }
  }

  async subscribeToNewNotifications() {
    const user = await this.supabaseService.getUser();
    if (user) {
      this.notificationSubscription = this.supabaseService.subscribeToNotifications(
        user.id,
        (newNotification) => {
          console.log('Nouvelle notification reçue:', newNotification);
          this.notifications.unshift(newNotification);
        }
      );
    }
  }

  async markAsRead(slidingItem: IonItemSliding, notification: Notification) {
    try {
      await this.supabaseService.markNotificationAsRead(notification.id.toString());
      notification.is_read = true;
      slidingItem.close();
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  }

  async deleteNotification(slidingItem: IonItemSliding, notification: Notification) {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      slidingItem.close();
    }
  }

  getNotificationIcon(notification: Notification): string {
    if (notification.title.toLowerCase().includes('terminé')) return 'checkmark-circle-outline';
    if (notification.title.toLowerCase().includes('reçue')) return 'document-outline';
    if (notification.title.toLowerCase().includes('mis à jour')) return 'create-outline';
    if (notification.title.toLowerCase().includes('message')) return 'chatbubble-ellipses-outline';
    return 'notifications-outline';
  }

  getNotificationColor(notification: Notification): string {
    if (notification.title.toLowerCase().includes('terminé')) return '#34c759';
    if (notification.title.toLowerCase().includes('important')) return '#ff3b30';
    if (notification.title.toLowerCase().includes('mis à jour')) return '#4d5ef2';
    if (notification.title.toLowerCase().includes('message')) return '#ffb300';
    return '#232323';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now.getTime() - notificationDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

}
