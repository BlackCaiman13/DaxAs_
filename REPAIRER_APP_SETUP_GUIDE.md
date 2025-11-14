# Guide de Création de l'Application Réparateur

## Vue d'Ensemble

Ce guide vous accompagne étape par étape dans la création de l'application mobile native pour les réparateurs utilisant Ionic Angular et Capacitor.

---

## Prérequis

```bash
# Vérifier les installations
node --version  # v18+
npm --version   # v9+
ionic --version # v7+

# Si Ionic CLI n'est pas installé:
npm install -g @ionic/cli
```

---

## Étape 1: Création du Projet

### 1.1 Créer le Nouveau Projet

```bash
# Se placer dans le dossier parent (un niveau au-dessus du projet client)
cd /tmp/cc-agent/60038437

# Créer le projet réparateur
ionic start fixho-repairer blank --type=angular --capacitor

# Répondre aux questions:
# ? Framework: Angular
# ? Starter template: blank
# ? Would you like to install npm dependencies? Yes
```

### 1.2 Structure Initiale

```bash
cd fixho-repairer

# Créer la structure de dossiers
mkdir -p src/app/{Models,Services,Pages,Components,Guards}
```

---

## Étape 2: Configuration de l'Environnement

### 2.1 Créer le Fichier .env

```bash
# Créer .env à la racine du projet
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ooshilkytlpmxwxgvfmu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vc2hpbGt5dGxwbXh3eGd2Zm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDQyMzUsImV4cCI6MjA2ODI4MDIzNX0.X4XXLJI-skI-PoIJ9ugp-djvK0huV7U1D_wSFSKbwvI
EOF
```

### 2.2 Créer environment.ts

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://ooshilkytlpmxwxgvfmu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vc2hpbGt5dGxwbXh3eGd2Zm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDQyMzUsImV4cCI6MjA2ODI4MDIzNX0.X4XXLJI-skI-PoIJ9ugp-djvK0huV7U1D_wSFSKbwvI'
};
```

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  supabaseUrl: 'https://ooshilkytlpmxwxgvfmu.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vc2hpbGt5dGxwbXh3eGd2Zm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MDQyMzUsImV4cCI6MjA2ODI4MDIzNX0.X4XXLJI-skI-PoIJ9ugp-djvK0huV7U1D_wSFSKbwvI'
};
```

### 2.3 Installer les Dépendances

```bash
# Installer Supabase client
npm install @supabase/supabase-js

# Installer d'autres dépendances utiles
npm install date-fns
```

---

## Étape 3: Copier les Modèles

### 3.1 Copier tous les Modèles depuis le Projet Client

```bash
# Depuis le dossier fixho-repairer
cp -r ../project/src/app/Models/* src/app/Models/
```

Les modèles suivants doivent être copiés:
- `profile.model.ts`
- `device.model.ts`
- `request.model.ts`
- `request-photo.model.ts`
- `notification.model.ts`
- `quote.model.ts`
- `payment.model.ts`
- `assignment.model.ts`
- `index.ts`

---

## Étape 4: Créer le Service Supabase Réparateur

### 4.1 Créer le Service

```typescript
// src/app/Services/supabase/supabase.service.ts
import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import {
  Profile,
  Device,
  Request,
  RequestPhoto,
  Notification,
  Quote,
  Payment,
  Assignment
} from 'src/app/Models';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage,
        storageKey: 'fixho-repairer-session',
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN') {
        this.saveSession(session);
      } else if (event === 'SIGNED_OUT') {
        this.saveSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        this.saveSession(session);
      }
    });

    this.restoreSession();
  }

  // ====== AUTHENTICATION ======

  private async restoreSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (session) {
      this.saveSession(session);
    }
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return error ? null : user;
  }

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    return error ? null : session;
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        this.saveSession(data.session);
      }

      // Vérifier le rôle
      const user = await this.getUser();
      if (user) {
        const profile = await this.getProfile(user.id);
        if (profile?.role !== 'repairer') {
          await this.signOut();
          throw new Error('Accès non autorisé. Seuls les réparateurs peuvent se connecter.');
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      await this.handleError(error as Error);
      return { data: null, error };
    }
  }

  async signOut() {
    await this.supabase.auth.signOut();
    sessionStorage.removeItem('fixho-repairer-session');
  }

  private saveSession(session: Session | null) {
    if (session) {
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      };
      sessionStorage.setItem('fixho-repairer-session', JSON.stringify(sessionData));
    } else {
      sessionStorage.removeItem('fixho-repairer-session');
    }
  }

  // ====== PROFILE ======

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }
  }

  // ====== REQUESTS - REPAIRER SPECIFIC ======

  async getMyAssignedRequests(repairerId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('assignments')
        .select(`
          *,
          request:requests!assignments_request_id_fkey(
            *,
            user:profiles!requests_user_id_fkey(
              id,
              fullname,
              phone,
              avatar_url
            ),
            device:devices(*),
            photos:request_photos(*),
            quotes:quotes(*)
          )
        `)
        .eq('repairer_id', repairerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data?.map(a => a.request) || [];
    } catch (error) {
      console.error('Erreur récupération demandes assignées:', error);
      return [];
    }
  }

  async getRequestDetailsForRepairer(requestId: number): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          user:profiles!requests_user_id_fkey(
            id,
            fullname,
            phone,
            avatar_url
          ),
          device:devices(*),
          photos:request_photos(*),
          quotes:quotes(*),
          assignment:assignments!assignments_request_id_fkey(
            id,
            repairer_id,
            status
          )
        `)
        .eq('id', requestId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération détails demande:', error);
      return null;
    }
  }

  // ====== QUOTES - REPAIRER SPECIFIC ======

  async createQuote(quote: Partial<Quote>): Promise<Quote | null> {
    try {
      const user = await this.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await this.supabase
        .from('quotes')
        .insert({
          ...quote,
          repairer_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur création devis:', error);
      await this.handleError(error as Error);
      return null;
    }
  }

  async updateQuote(quoteId: number, updates: Partial<Quote>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .eq('status', 'pending');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur mise à jour devis:', error);
      await this.handleError(error as Error);
      return false;
    }
  }

  async getMyQuotes(repairerId: string): Promise<Quote[]> {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('repairer_id', repairerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération mes devis:', error);
      return [];
    }
  }

  // ====== REQUEST STATUS ======

  async updateRequestStatus(requestId: number, status: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      await this.handleError(error as Error);
      return false;
    }
  }

  // ====== PAYMENTS ======

  async markPaymentAsCollected(paymentId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur marquage paiement:', error);
      await this.handleError(error as Error);
      return false;
    }
  }

  async getPaymentByQuoteId(quoteId: number): Promise<Payment | null> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération paiement:', error);
      return null;
    }
  }

  // ====== NOTIFICATIONS ======

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return [];
    }
  }

  async createNotification(userId: string, notification: Partial<Notification>): Promise<Notification | null> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          message: notification.message,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return null;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  }

  // ====== REALTIME SUBSCRIPTIONS ======

  subscribeToMyAssignedRequests(repairerId: string, callback: (assignment: Assignment) => void) {
    return this.supabase
      .channel('my-assignments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assignments',
        filter: `repairer_id=eq.${repairerId}`
      }, (payload) => {
        callback(payload.new as Assignment);
      })
      .subscribe();
  }

  subscribeToQuoteResponses(repairerId: string, callback: (quote: Quote) => void) {
    return this.supabase
      .channel('quote-responses')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quotes',
        filter: `repairer_id=eq.${repairerId}`
      }, (payload) => {
        callback(payload.new as Quote);
      })
      .subscribe();
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return this.supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as Notification);
      })
      .subscribe();
  }

  // ====== UTILITIES ======

  async handleError(error: Error) {
    const toast = await this.toastCtrl.create({
      message: error.message,
      duration: 3000,
      color: 'danger'
    });
    await toast.present();
  }

  async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({ message, spinner: 'circular' });
    await loading.present();
    return loading;
  }
}
```

---

## Étape 5: Créer les Guards

### 5.1 Auth Guard

```typescript
// src/app/Guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../Services/supabase/supabase.service';

export const authGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabaseService.getSession();

  if (!session) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
```

### 5.2 Role Guard

```typescript
// src/app/Guards/role.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../Services/supabase/supabase.service';

export const roleGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabaseService.getUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const profile = await supabaseService.getProfile(user.id);
  if (profile?.role !== 'repairer') {
    await supabaseService.signOut();
    router.navigate(['/login']);
    return false;
  }

  return true;
};
```

---

## Étape 6: Configurer Capacitor

### 6.1 Modifier capacitor.config.ts

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daxas.fixho.repairer',
  appName: 'FixHo Réparateur',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#4d5ef2",
      showSpinner: false
    }
  }
};

export default config;
```

---

## Étape 7: Commandes pour Continuer

```bash
# Générer les pages nécessaires
ionic generate page Pages/login
ionic generate page Pages/dashboard
ionic generate page Pages/request-details
ionic generate page Pages/create-quote
ionic generate page Pages/notifications
ionic generate page Pages/profile

# Générer des composants si nécessaire
ionic generate component Components/request-card
ionic generate component Components/quote-form

# Lancer en mode dev
ionic serve

# Ajouter la plateforme Android
ionic capacitor add android

# Build et sync
ionic build
ionic capacitor sync

# Ouvrir dans Android Studio
ionic capacitor open android
```

---

## Prochaines Étapes

Suivez maintenant le fichier `IMPLEMENTATION_PROGRESS.md` pour implémenter chaque page et fonctionnalité dans l'ordre défini.

Les sections prioritaires sont:
1. Page Login
2. Dashboard avec liste des demandes
3. Page détails de la demande
4. Formulaire de création de devis
5. Gestion des paiements

Bonne implémentation! 🚀
