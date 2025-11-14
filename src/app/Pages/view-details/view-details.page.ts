import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonIcon,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';
import { Quote, Payment } from 'src/app/Models';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.page.html',
  styleUrls: ['./view-details.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonBadge,
    IonIcon,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
  ]
})
export class ViewDetailsPage implements OnInit, OnDestroy {
  request: any = null;
  quote: Quote | null = null;
  payment: Payment | null = null;
  loading = true;
  private quoteSubscription: any;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.request = navigation.extras.state['request'];
    }
  }

  async ngOnInit() {
    if (!this.request || !this.request.id) {
      this.router.navigate(['/tabs/request']);
      return;
    }

    await this.loadRequestDetails();
    await this.subscribeToQuotes();
  }

  ngOnDestroy() {
    if (this.quoteSubscription) {
      this.quoteSubscription.unsubscribe();
    }
  }

  async loadRequestDetails() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getUser();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.request = await this.supabaseService.getRequestById(this.request.id);

      if (!this.request) {
        throw new Error('Demande non trouvée');
      }

      if (this.request.user_id !== user.id) {
        await this.showToast('Vous n\'avez pas accès à cette demande', 'danger');
        this.router.navigate(['/tabs/request']);
        return;
      }

      if (this.request.quotes && this.request.quotes.length > 0) {
        this.quote = this.request.quotes[0];

        if (this.quote && this.quote.status === 'accepted') {
          this.payment = await this.supabaseService.getPaymentByQuoteId(this.quote.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      await this.showToast('Erreur lors du chargement des détails', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async subscribeToQuotes() {
    if (this.request && this.request.id) {
      this.quoteSubscription = this.supabaseService.subscribeToRequestQuotes(
        this.request.id,
        async (updatedQuote) => {
          console.log('Devis mis à jour:', updatedQuote);
          this.quote = updatedQuote;
          await this.showToast('Le devis a été mis à jour', 'success');
        }
      );
    }
  }

  async acceptQuote() {
    if (!this.quote) return;

    const alert = await this.alertController.create({
      header: 'Accepter le devis',
      message: `Confirmez-vous l'acceptation du devis de ${this.formatAmount(this.quote.amount)} ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Accepter',
          handler: async () => {
            const success = await this.supabaseService.acceptQuote(this.quote!.id);
            if (success) {
              this.quote!.status = 'accepted';
              await this.showToast('Devis accepté avec succès', 'success');

              const user = await this.supabaseService.getUser();
              if (user) {
                await this.supabaseService.createNotification(user.id, {
                  title: 'Devis accepté',
                  message: `Vous avez accepté le devis de ${this.formatAmount(this.quote!.amount)}. Le paiement sera collecté lors de la livraison.`,
                  is_read: false
                });
              }

              await this.loadRequestDetails();
            } else {
              await this.showToast('Erreur lors de l\'acceptation du devis', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async rejectQuote() {
    if (!this.quote) return;

    const alert = await this.alertController.create({
      header: 'Refuser le devis',
      message: 'Souhaitez-vous indiquer une raison pour le refus ?',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Raison du refus (optionnel)',
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Refuser',
          handler: async (data) => {
            const success = await this.supabaseService.rejectQuote(this.quote!.id, data.reason);
            if (success) {
              this.quote!.status = 'rejected';
              await this.showToast('Devis refusé', 'warning');
              await this.loadRequestDetails();
            } else {
              await this.showToast('Erreur lors du refus du devis', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmCashPayment() {
    if (!this.quote) return;

    const alert = await this.alertController.create({
      header: 'Confirmer le paiement en espèces',
      message: `Vous paierez ${this.formatAmount(this.quote.amount)} en espèces lors de la récupération de votre appareil.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: async () => {
            const payment = await this.supabaseService.createCashPayment(this.quote!.id, this.quote!.amount);
            if (payment) {
              this.payment = payment;
              await this.showToast('Paiement confirmé. Vous paierez en espèces lors de la récupération.', 'success');
            } else {
              await this.showToast('Erreur lors de la confirmation du paiement', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'primary',
      'in_progress': 'warning',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colorMap[status] || 'medium';
  }

  getQuoteStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'En attente de réponse',
      'accepted': 'Accepté',
      'rejected': 'Refusé'
    };
    return statusMap[status] || status;
  }

  getQuoteStatusColor(status: string): string {
    const colorMap: { [key: string]: string} = {
      'pending': 'warning',
      'accepted': 'success',
      'rejected': 'danger'
    };
    return colorMap[status] || 'medium';
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Non défini';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPhotoUrl(photo: any): string {
    return photo.photo_url || '';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
