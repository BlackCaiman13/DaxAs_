import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { LoadingController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class OsServicesService {

  constructor(
    public supabaseService: SupabaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) { }

  async getDeviceInfo() {
    return await Device.getInfo();
  }

  async getBatteryInfo() {
    return await Device.getBatteryInfo();
  }

  async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent'
    });
    await loading.present();
    return loading;
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
