import { Component, OnInit, OnDestroy, Input } from '@angular/core';
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
  ModalController,
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
    private toastController: ToastController,
    private modalController: ModalController
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

  async openPhotoModal(index: number) {
    const modal = await this.modalController.create({
      component: PhotoModalComponent,
      componentProps: {
        photos: this.request.photos,
        initialIndex: index
      },
      cssClass: 'photo-modal'
    });
    await modal.present();
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

// Photo Modal Component
@Component({
  selector: 'app-photo-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Photo {{currentIndex + 1}} / {{photos.length}}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="photo-modal-content">
      <div class="photo-viewer">
        <ion-button fill="clear" class="nav-button prev" (click)="previousPhoto()" [disabled]="currentIndex === 0">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </ion-button>

        <div class="photo-container">
          <img [src]="photos[currentIndex].photo_url" alt="Photo" />
        </div>

        <ion-button fill="clear" class="nav-button next" (click)="nextPhoto()" [disabled]="currentIndex === photos.length - 1">
          <ion-icon name="chevron-forward-outline"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .photo-modal-content {
      --background: rgba(0, 0, 0, 0.95);
    }

    .photo-viewer {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      position: relative;
    }

    .photo-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;

      img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
      }
    }

    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      --color: white;
      font-size: 2rem;
      z-index: 10;

      &.prev {
        left: 1rem;
      }

      &.next {
        right: 1rem;
      }

      ion-icon {
        font-size: 2.5rem;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon
  ]
})
export class PhotoModalComponent implements OnInit {
  @Input() photos: any[] = [];
  @Input() initialIndex = 0;
  currentIndex = 0;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.currentIndex = this.initialIndex;
  }

  nextPhoto() {
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    }
  }

  previousPhoto() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
