import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthChangeEvent, createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { Profile, Device, Request, RequestPhoto, Notification, Quote, Payment } from 'src/app/Models';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    console.log('Initialisation du service Supabase');

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage,
        storageKey: 'fixho-session',
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    // Écouter les changements d'état d'authentification
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Événement d\'authentification:', event);
      console.log('Session:', session);

      if (event === 'SIGNED_IN') {
        console.log('Utilisateur connecté');
        this.saveSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('Utilisateur déconnecté');
        this.saveSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token rafraîchi');
        this.saveSession(session);
      }
    });

    // Restaurer la session au démarrage
    this.restoreSession();
  }

  // 🔐 Restauration de session
  private async restoreSession() {
    console.log('Tentative de restauration de la session...');
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        console.log('Session restaurée avec succès');
        this.saveSession(session);
      } else {
        console.log('Aucune session à restaurer');
        const savedSession = sessionStorage.getItem('fixho-session');
        if (savedSession) {
          console.log('Session trouvée dans le stockage, tentative de restauration...');
          try {
            const parsedSession = JSON.parse(savedSession);
            const { data, error } = await this.supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token
            });

            if (error) throw error;

            if (!data.session) {
              console.log('Session expirée, tentative de rafraîchissement...');
              await this.refreshSession();
            } else {
              console.log('Session restaurée depuis le stockage');
            }
          } catch (e) {
            console.error('Erreur lors de la restauration de la session depuis le stockage:', e);
            sessionStorage.removeItem('fixho-session');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de la session:', error);
      sessionStorage.removeItem('fixho-session');
    }
  }

  // 👤 Récupération utilisateur
  async getUser() {
    try {
      const session = await this.getSession();
      if (!session) return null;

      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      if (!session) return await this.refreshSession();
      return session;
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
  }

  // 📝 Mise à jour ou création de profil
  async updateProfile(profile: Profile) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          fullname: profile.fullname,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          role: profile.role
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil :', error);
      await this.handleError(error as Error);
      return null;
    }
  }

  // ✉️ Inscription d'un nouvel utilisateur
  async signUp(email: string, password: string, fullname?: string, phone?: string) {
    try {
      // Vérification des données d'entrée
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      console.log('Début de l\'inscription pour:', email);
      
      // Inscription avec les données de profil dans les metadata
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullname: fullname || null,
            phone: phone || null
          }
        }
      });

      if (authError) {
        console.error('Erreur d\'authentification:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.error('Pas de données utilisateur reçues');
        throw new Error('Impossible de créer l\'utilisateur');
      }

      console.log('Inscription réussie, id:', authData.user.id);

      return { data: authData, error: null };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      await this.handleError(error as Error);
      return { data: null, error };
    }
  }

  // � Application des données de profil en attente
  private async applyPendingProfileData(userId: string) {
    const pendingDataKey = `pending-profile-${userId}`;
    const pendingData = sessionStorage.getItem(pendingDataKey);
    
    if (pendingData) {
      try {
        console.log('Application des données de profil en attente');
        const profileData = JSON.parse(pendingData);
        
        const { error: updateError } = await this.supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);

        if (updateError) {
          console.warn('Erreur lors de la mise à jour différée du profil:', updateError);
        } else {
          console.log('Mise à jour différée du profil réussie');
          sessionStorage.removeItem(pendingDataKey);
        }
      } catch (error) {
        console.error('Erreur lors de l\'application des données de profil en attente:', error);
      }
    }
  }

  // �🔐 Connexion
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        this.saveSession(data.session);
        if (data.user) {
          await this.applyPendingProfileData(data.user.id);
        }
      }
      
      const user = await this.getUser();
      if (!user) throw new Error('Impossible de récupérer les informations de l\'utilisateur');

      return { data, error: null };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      await this.handleError(error as Error);
      return { data: null, error };
    }
  }

  // 🚪 Déconnexion
  async signOut() {
    try {
      await this.supabase.auth.signOut();
      sessionStorage.removeItem('fixho-session');
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  // 🔄 Rafraîchir la session
  async refreshSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      if (error) throw error;
      if (session) this.saveSession(session);
      return session;
    } catch (error) {
      sessionStorage.removeItem('fixho-session');
      await this.handleError(error as Error);
      return null;
    }
  }

  // 🌍 Utilitaires
  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      this.saveSession(session);
      callback(event, session);
    });
  }

  private saveSession(session: Session | null) {
    console.log('Sauvegarde de la session:', session ? 'présente' : 'null');
    if (session) {
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      };
      sessionStorage.setItem('fixho-session', JSON.stringify(sessionData));
    } else {
      sessionStorage.removeItem('fixho-session');
    }
  }

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


  private async compressImage(file: File, maxWidth = 200, maxHeight = 200, quality = 0.8): Promise<File> {
    const imageBitmap = await createImageBitmap(file);

    // Calcul des nouvelles dimensions
    let { width, height } = imageBitmap;
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    // Dessine l'image sur un canvas redimensionné
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de créer le contexte canvas');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convertit le canvas en Blob compressé
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality)
    );

    return new File([blob], file.name, { type: 'image/jpeg' });
  }

  /**
   * Upload l'image de profil de l'utilisateur
   */
  async uploadUserAvatar(file: File, userId: string) {
    try {
      // Compression
      const compressedFile = await this.compressImage(file);

      // Upload dans le bucket avatars
      const filePath = `avatars/${userId}.jpg`;

      const { data, error } = await this.supabase.storage
        .from('user_avatar')
        .upload(filePath, compressedFile, {
          upsert: true, // permet d'écraser l'ancienne image
          cacheControl: '3600',
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Erreur upload avatar:', error);
        throw error;
      }

      console.log(' Avatar uploadé avec succès:', data);
      return data;
    } catch (err) {
      console.error('Erreur lors de l’upload de l’avatar:', err);
      throw err;
    }
  }

  /**
   * Récupère l'URL publique de l'avatar
   */
  // async getAvatarUrl(userId: string): Promise<string> {
  //   try {
  //     const { data } = this.supabase.storage
  //       .from('user_avatar')
  //       .getPublicUrl(`avatars/${userId}.jpg`);

  //     console.log('URL de l\'avatar:', data.publicUrl);
  //     return data.publicUrl;
  //   } catch (error) {
  //     console.error('Erreur lors de la récupération de l\'URL de l\'avatar:', error);
  //     return this.defaultAvatarUrl;
  //   }
  // }

  // private get defaultAvatarUrl(): string {
  //   return 'assets/images/default-avatar.svg';
  // }

  // 📱 Gestion des appareils
  async getUserDevices(userId: string): Promise<Device[]> {
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      return [];
    }
  }

  async addDevice(device: Partial<Device>): Promise<Device | null> {
    try {
      const { data, error } = await this.supabase
        .from('devices')
        .insert(device)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'appareil:', error);
      await this.handleError(error as Error);
      return null;
    }
  }

  // 📝 Gestion des requêtes
  async getRequests(userId: string): Promise<Request[]> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select('*, device:devices(*), photos:request_photos(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des requêtes:', error);
      return [];
    }
  }

  async createRequest(request: Partial<Request>): Promise<Request | null> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la requête:', error);
      await this.handleError(error as Error);
      return null;
    }
  }

  async uploadRequestPhotos(files: File[], requestId: string): Promise<RequestPhoto[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await this.compressImage(file, 800, 800, 0.8);
        const filePath = `requests/${requestId}/${file.name}`;

        const { data: uploadData, error: uploadError } = await this.supabase.storage
          .from('request_photos')
          .upload(filePath, compressedFile, {
            upsert: true,
            cacheControl: '3600',
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = this.supabase.storage
          .from('request_photos')
          .getPublicUrl(filePath);

        const { data: photoData, error: insertError } = await this.supabase
          .from('request_photos')
          .insert({
            request_id: requestId,
            photo_url: urlData.publicUrl,
            file_path: filePath
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return photoData;
      });

      const photos = await Promise.all(uploadPromises);
      return photos;
    } catch (error) {
      console.error('Erreur lors de l\'upload des photos:', error);
      await this.handleError(error as Error);
      return [];
    }
  }

  // 🔔 Gestion des notifications
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
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
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
      console.error('Erreur lors du marquage de la notification:', error);
      await this.handleError(error as Error);
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
          is_read: notification.is_read || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return null;
    }
  }

  // ⚡ Abonnements en temps réel
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

  subscribeToRequestUpdates(userId: string, callback: (request: Request) => void) {
    return this.supabase
      .channel('requests')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as Request);
      })
      .subscribe();
  }

  async getRequestById(requestId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          device:devices(*),
          photos:request_photos(*),
          quotes:quotes(*)
        `)
        .eq('id', requestId)
        .order('created_at', { foreignTable: 'quotes', ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la requête:', error);
      await this.handleError(error as Error);
      return null;
    }
  }

  async getQuoteByRequestId(requestId: number): Promise<Quote | null> {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du devis:', error);
      return null;
    }
  }

  async acceptQuote(quoteId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'acceptation du devis:', error);
      await this.handleError(error as Error);
      return false;
    }
  }

  async rejectQuote(quoteId: number, rejectionReason?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors du refus du devis:', error);
      await this.handleError(error as Error);
      return false;
    }
  }

  async createCashPayment(quoteId: number, amount: number): Promise<Payment | null> {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .insert({
          quote_id: quoteId,
          amount: amount,
          payment_method: 'cash',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      await this.handleError(error as Error);
      return null;
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
      console.error('Erreur lors de la récupération du paiement:', error);
      return null;
    }
  }

  subscribeToRequestQuotes(requestId: number, callback: (quote: Quote) => void) {
    return this.supabase
      .channel(`quotes-${requestId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quotes',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        callback(payload.new as Quote);
      })
      .subscribe();
  }

  async getRequestsWithQuotes(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('requests')
        .select(`
          *,
          device:devices(*),
          photos:request_photos(*),
          quotes:quotes(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des requêtes avec devis:', error);
      return [];
    }
  }
}
