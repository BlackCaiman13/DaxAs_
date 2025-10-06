import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent,  IonButton } from '@ionic/angular/standalone';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [ IonContent, IonButton, CommonModule, FormsModule],
})
export class OnboardingPage implements OnInit {
  @ViewChild('swiper')
    swiperRef: ElementRef | undefined;
  public onboardingData : any = [];
  constructor() { }

  title_list = [
    'Votre parcours de réparation, simplifié',
    'On vient à vous !',
    'Suivez, payez, récupérez !'
  ];

  description_list = [
    'Gérez sans effort toutes les réparations de votre appareil, de la demande à la réalisation. Nous vous facilitons la tâche.',
    'Nous venons chercher votre appareil à l\'endroit de votre choix, pour le réparer dans notre atelier.',
    'Suivez l\'avancement de votre réparation, payez en ligne et récupérez votre appareil réparé !'
  ];
  image_list = [
    'https://placehold.co/180x180',
    'https://placehold.co/180x180',
    'https://placehold.co/180x180'
  ];
  ngOnInit() {

    this.onboardingData = [
      { title: this.title_list[0],
        description: this.description_list[0],
        image: this.image_list[0],
        status : 33,
      },
      { title: this.title_list[1],
        description: this.description_list[1],
        image: this.image_list[1],
        status : 66,
      },
      { title: this.title_list[2],
        description: this.description_list[2],
        image: this.image_list[2],
        status : 100
      }
    ];

  }

  next() {
    if (this.swiperRef) {
      if (this.swiperRef.nativeElement.swiper.isEnd) {
        this.navigateToHome();
        return;
      }
      else {
        this.swiperRef.nativeElement.swiper.slideNext();
      }
    }
  }
  skip() {
    if (this.swiperRef) {
      if (!this.swiperRef.nativeElement.swiper.isEnd) {
        this.swiperRef.nativeElement.swiper.slideTo(this.onboardingData.length - 1);
      }
      else {
        this.navigateToHome();
      }
    }
  }

  navigateToHome() {
    window.location.href = '/tabs/home';
  }

}
