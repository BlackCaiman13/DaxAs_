import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonIcon, 
  IonToggle,
  IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase/supabase.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonIcon,
    IonToggle,
    IonButton,
    CommonModule, 
    FormsModule
  ]
})
export class ProfilePage implements OnInit {
  userData: any = null;
  notificationsEnabled = true;

  constructor(
    private supabaseService: SupabaseService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('Session actuelle:', await this.supabaseService.getSession());
    console.log('Utilisateur actuel:', await this.supabaseService.getUser());
    const user = await this.supabaseService.getUser();
    if (user) {
      this.userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.['fullname'] || 'Utilisateur',
        phone: user.user_metadata?.['phone']
      };
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Déconnexion',
          role: 'destructive',
          handler: async () => {
            await this.supabaseService.signOut();
            sessionStorage.clear();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      ]
    });

    await alert.present();
  }

  get userInitials(): string {
    if (!this.userData?.name) return '?';
    return this.userData.name
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase();
  }

  async editName() {
    // TODO: Implémenter la logique de modification du nom
    console.log('Édition du nom');
  }

  async editPhone() {
    // TODO: Implémenter la logique de modification du téléphone
    console.log('Édition du téléphone');
  }

  toggleNotifications(event: any) {
    this.notificationsEnabled = event.detail.checked;
    // TODO: Implémenter la logique de gestion des notifications
    console.log('Notifications:', this.notificationsEnabled);
  }
}
