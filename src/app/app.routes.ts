import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./Pages/tab-bar/tab-bar.component').then((m) => m.TabBarComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./Pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'request',
        loadComponent: () => import('./Pages/request/request.page').then((m) => m.RequestPage),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./Pages/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./Pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'view-details',
        loadComponent: () => import('./Pages/view-details/view-details.page').then((m) => m.ViewDetailsPage),
      },
      
      {
        path: 'request-confirmed',
        loadComponent: () => import('./Pages/request-confirmed/request-confirmed.page').then((m) => m.RequestConfirmedPage),
      }
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./Pages/onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: 'new-request',
    loadComponent: () => import('./Pages/new-request/new-request.page').then((m) => m.NewRequestPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./Pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./Pages/signup/signup.page').then( m => m.SignupPage)
  }
];
