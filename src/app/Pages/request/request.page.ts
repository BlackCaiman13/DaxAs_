import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonIcon, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { Request, RequestStatus } from 'src/app/Models';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  styleUrls: ['./request.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonButton, IonSpinner, IonIcon, CommonModule, FormsModule, RouterLink]
})
export class RequestPage implements OnInit {
  requests: Request[] = [];
  loading = true;

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadRequests();
  }

  async loadRequests() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getUser();
      if (user) {
        this.requests = await this.supabaseService.getRequests(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      this.loading = false;
    }
  }

  getStatusLabel(status: RequestStatus): string {
    const statusMap: Record<RequestStatus, string> = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: RequestStatus): string {
    const colorMap: Record<RequestStatus, string> = {
      'pending': '#4d5ef2',
      'in_progress': '#c48a1b',
      'completed': '#34c759',
      'cancelled': '#ff3b30'
    };
    return colorMap[status] || '#232323';
  }

}
