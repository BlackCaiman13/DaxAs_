import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';
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
  IonDatetime,
  IonButtons,
  IonBackButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-new-request',
  templateUrl: './new-request.page.html',
  styleUrls: ['./new-request.page.scss'],
  standalone: true,
  imports: [
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
    IonDatetime,
    IonButtons,
    IonBackButton
  ]
})




export class NewRequestPage {
  currentStep = 1;
  requestForm: FormGroup;
  selectedPhotos: string[] = [];

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
      if (this.requestForm.valid) {
        // Met à jour les photos dans le formulaire avant de naviguer
        this.requestForm.patchValue({ photos: this.selectedPhotos });
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

  async addPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        promptLabelHeader: 'Sélectionner une source',
        promptLabelPhoto: 'Choisir depuis la galerie',
        promptLabelPicture: 'Prendre une photo',
        width: 1024,
        correctOrientation: true
      });

      if (image.webPath) {
        this.selectedPhotos.push(image.webPath);
        // Met à jour le contrôle du formulaire
        this.requestForm.patchValue({ photos: this.selectedPhotos });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de la photo:', error);
    }
  }

  removePhoto(index: number) {
    this.selectedPhotos.splice(index, 1);
    // Met à jour le contrôle du formulaire
    this.requestForm.patchValue({ photos: this.selectedPhotos });
  }

  

  get stepProgress() {
    return (this.currentStep / 3) * 100;
  }
}
