import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SupabaseService } from '../../Services/supabase/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabaseService.getSession();
  if (session) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const session = await supabaseService.getSession();
  if (session) {
    return router.createUrlTree(['/tabs/home']);
  }

  return true;
};