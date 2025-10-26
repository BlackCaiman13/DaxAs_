import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../Services/supabase/supabase.service';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AvatarComponent implements OnInit {
  @Input() avatar?: string | null;
  @Input() size?: number;
  @Input() centered = true;
  
  avatarUrl: string | null = null;
  defaultAvatar = 'assets/icon/man.png';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    if (this.size) {
      document.documentElement.style.setProperty('--avatar-size', `${this.size}px`);
    }
    // this.loadAvatar();
  }

  // private loadAvatar() {
  //   if (this.userId) {
  //     this.supabaseService.getAvatarUrl(this.userId).then(url => {
  //       if (url) {
  //         this.avatarUrl = url;
  //       }
  //     });
  //   }
  // }

  onImageError() {
    this.avatarUrl = this.defaultAvatar;
  }
}