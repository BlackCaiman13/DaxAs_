import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../Services/supabase/supabase.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
  ]
})
export class SignupPage {
  signupForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    this.signupForm = this.fb.group(
      {
        username: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async signUp() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      const { email, password, username, phone } = this.signupForm.value;

      try {
        // Création du compte avec toutes les informations
        const { data, error } = await this.supabaseService.signUp(email, password, username, phone);
        if (error) throw error;

        const toast = await this.toastCtrl.create({
          message: 'Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.',
          duration: 5000,
          color: 'success',
          position: 'top'
        });
        await toast.present();

        this.router.navigate(['/login']);
      } catch (error) {
        const errorMessage = (error as any).message || 'Une erreur est survenue lors de l\'inscription';
        const toast = await this.toastCtrl.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      } finally {
        this.isLoading = false;
      }
    }
  }

  togglePassword(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
