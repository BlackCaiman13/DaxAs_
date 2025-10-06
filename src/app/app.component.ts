import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { register } from 'swiper/element/bundle';
import {SupabaseService} from './Services/supabase/supabase.service'

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  providers: [SupabaseService],
})
export class AppComponent {
  constructor(private supabaseService: SupabaseService) {}
}
