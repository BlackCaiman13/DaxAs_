import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tab-bar/tab-bar.component').then((m) => m.TabBarComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'request',
        loadComponent: () => import('./request/request.page').then((m) => m.RequestPage),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: 'request',
    loadComponent: () => import('./request/request.page').then( m => m.RequestPage)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.page').then( m => m.NotificationsPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then( m => m.ProfilePage)
  },
];
