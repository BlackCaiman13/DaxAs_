import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { OsServicesService } from 'src/app/Services/os-services/os-services.service';
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
  IonBackButton, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';

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
    IonBackButton, IonSelect, IonSelectOption
  ]
})




export class NewRequestPage {
  currentStep = 1;
  requestForm: FormGroup;
  selectedPhotos: string[] = [];
  photoFiles: File[] = [];
  platformInfo: any;

  constructor(private fb: FormBuilder, private router: Router, private osServices: OsServicesService) {
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

  ngOnInit() {
    this.platformInfo = this.osServices.getDeviceInfo().then(info => (this.platformInfo = info.platform));
  }

  async nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      if (this.requestForm.valid) {
        await this.submitRequest();
      }
    }
  }

  async submitRequest() {
    const loading = await this.osServices.showLoading('Création de la demande...');

    try {
      const user = await this.osServices.supabaseService.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const formValue = this.requestForm.value;

      const request = await this.osServices.supabaseService.createRequest({
        user_id: user.id,
        device_id: null,
        model: formValue.deviceType + (formValue.model ? ' ' + formValue.model : ''),
        problem_description: formValue.problemDescription,
        location: formValue.location,
        location_details: formValue.locationDetails,
        scheduled_at: formValue.collectionDate ? new Date(formValue.collectionDate) : null,
        status: 'pending'
      });

      if (!request) {
        throw new Error('Erreur lors de la création de la demande');
      }

      if (this.photoFiles.length > 0) {
        loading.message = 'Upload des photos...';
        await this.osServices.supabaseService.uploadRequestPhotos(this.photoFiles, request.id.toString());
      }

      await this.osServices.supabaseService.createNotification(user.id, {
        title: 'Demande reçue',
        message: `Votre demande de réparation pour ${request.model} a été reçue avec succès. Référence: #${request.id}`,
        is_read: false
      });

      this.router.navigate(['/tabs/request-confirmed'], {
        state: {
          requestId: request.id,
          formData: this.requestForm.value
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      await this.osServices.showToast(error.message || 'Erreur lors de la création de la demande', 'danger');
    } finally {
      loading.dismiss();
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
        resultType: CameraResultType.Uri,
        promptLabelHeader: 'Sélectionner une source',
        promptLabelPhoto: 'Choisir depuis la galerie',
        promptLabelPicture: 'Prendre une photo',
        width: 1024,
        correctOrientation: true
      });

      if (image.webPath) {
        this.selectedPhotos.push(image.webPath);

        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.photoFiles.push(file);

        this.requestForm.patchValue({ photos: this.selectedPhotos });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de la photo:', error);
    }
  }

  removePhoto(index: number) {
    this.selectedPhotos.splice(index, 1);
    this.photoFiles.splice(index, 1);
    this.requestForm.patchValue({ photos: this.selectedPhotos });
  }

  async getCurrentLocation() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Cas mobile (Android / iOS)
        const coordinates = await Geolocation.getCurrentPosition();
        const { latitude, longitude } = coordinates.coords;
        this.toLisibleLocation(`${latitude}, ${longitude}`);

      }

      else {
        // Cas Web (navigateur)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            
            this.toLisibleLocation(`${latitude}, ${longitude}`);
          });

     

        } else {
          console.error('La géolocalisation n’est pas supportée');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la localisation', err);
    }
  }

  async toLisibleLocation(coord: string) {
    const [lat, lon] = coord.split(',').map(Number);
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();

      // Construire une adresse lisible
      const city = data.address.city || data.address.town || data.address.village || '';
      const district = data.address.suburb || data.address.neighbourhood || '';
      const displayAddress = `${city}${district ? ', ' + district : ''}`;

      // Remplir le formulaire
      this.requestForm.patchValue({
        location: displayAddress || `${lat}, ${lon}`,
      });
  }

  get stepProgress() {
    return (this.currentStep / 3) * 100;
  }
}
