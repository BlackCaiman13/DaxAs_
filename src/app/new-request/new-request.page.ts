import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonTextarea,
  IonDatetimeButton,
  IonDatetime,
  IonModal,
  IonButtons,
  IonBackButton, IonFooter } from '@ionic/angular/standalone';

@Component({
  selector: 'app-new-request',
  templateUrl: './new-request.page.html',
  styleUrls: ['./new-request.page.scss'],
  standalone: true,
  imports: [IonFooter, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonTextarea,
    IonDatetimeButton,
    IonDatetime,
    IonModal,
    IonButtons,
    IonBackButton
  ]
})
export class NewRequestPage {
  currentStep = 1;
  requestForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.requestForm = this.fb.group({
      deviceType: ['', Validators.required],
      model: [''],
      photos: [[]],
      location: ['', Validators.required],
      locationDetails: [''],
      collectionDate: ['', Validators.required],
      problemDescription: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      // Si tous les champs requis sont remplis, naviguez vers la confirmation
      if (this.requestForm.valid) {
        this.router.navigate(['/request-confirmed'], {
          state: { formData: this.requestForm.value }
        });
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addPhoto() {
    // Logique pour ajouter une photo
    console.log('Adding photo...');
  }

  get stepProgress() {
    return (this.currentStep / 3) * 100;
  }
}
