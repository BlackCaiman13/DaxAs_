import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonToolbar, IonHeader, IonTitle, IonAvatar } from '@ionic/angular/standalone';
import { OsServicesService } from 'src/app/Services/os-services/os-services.service';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonTitle, IonHeader, IonContent, IonButton, IonIcon, IonToolbar, CommonModule, FormsModule],
})
export class HomePage {
  
  platformInfo: any;
  userData: any = null;
  constructor(private osServices: OsServicesService, private supabaseService: SupabaseService) {
  
  }
  ngOnInit() {
    this.platformInfo = this.osServices.getDeviceInfo().then(info => (this.platformInfo = info.platform));
    this.loadUserData();
  }

  async loadUserData() {
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

  goToNewRequest() {
    // Navigate to the New Request page
    window.location.href = '/new-request';
  }

  
}
