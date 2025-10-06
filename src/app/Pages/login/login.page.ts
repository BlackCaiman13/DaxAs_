import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { SupabaseService } from 'src/app/Services/supabase/supabase.service';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner
  ],
})
export class LoginPage implements OnInit {
  showPassword = false;
  loginForm!: FormGroup;
  loading = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) {
     this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
   
  }

  async onLogin() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await this.supabaseService.signIn(email, password);

      if (error) throw error;

      const session = await this.supabaseService.getSession();
      if (!session) {
        throw new Error('Erreur lors de la récupération de la session');
      }

      this.showToast('Connexion réussie', 'success');
      this.navCtrl.navigateForward('/tabs/home', { replaceUrl: true });
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      this.showToast(error.message || 'Erreur de connexion', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
  }
}
