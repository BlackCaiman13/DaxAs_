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
      {
        path: 'view-details',
        loadComponent: () => import('./view-details/view-details.page').then((m) => m.ViewDetailsPage),
      },
      {
        path: 'new-request',
        loadComponent: () => import('./new-request/new-request.page').then((m) => m.NewRequestPage),
      },
      {
        path: 'request-confirmed',
        loadComponent: () => import('./request-confirmed/request-confirmed.page').then((m) => m.RequestConfirmedPage),
      },
      {
      }
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
  }
  


];
