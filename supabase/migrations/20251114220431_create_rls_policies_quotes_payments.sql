/*
  # Politiques RLS pour quotes, payments et mise à jour des politiques existantes

  ## 1. Politiques pour la table quotes
    - SELECT: Les clients voient les devis de leurs demandes, le réparateur voit tous les devis
    - INSERT: Seul le réparateur peut créer des devis
    - UPDATE: Le réparateur peut modifier les devis "pending", les clients peuvent modifier le status
    - DELETE: Seul le réparateur peut supprimer ses devis

  ## 2. Politiques pour la table payments
    - SELECT: Les clients voient leurs paiements, le réparateur voit tous les paiements
    - INSERT: Les clients peuvent créer un paiement après acceptation du devis
    - UPDATE: Le réparateur peut marquer le paiement comme collecté
    - DELETE: Personne ne peut supprimer un paiement (intégrité financière)

  ## 3. Mise à jour des politiques existantes
    - Modifier les politiques de requests pour permettre au réparateur de voir toutes les demandes
    - Modifier les politiques de requests pour permettre au réparateur de modifier le status
    - Modifier les politiques de request_photos pour permettre au réparateur de voir toutes les photos

  ## 4. Sécurité
    - Vérification stricte des rôles via la table profiles
    - Utilisation de auth.uid() pour identifier les utilisateurs
    - Validation des permissions à chaque opération
*/

-- =====================================================
-- POLITIQUES POUR LA TABLE QUOTES
-- =====================================================

-- Les clients peuvent voir les devis de leurs propres demandes
-- Le réparateur peut voir tous les devis
CREATE POLICY "Users can view quotes for their requests and repairers can view all"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (
    -- Le client peut voir les devis de ses demandes
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = quotes.request_id
      AND requests.user_id = auth.uid()
    )
    OR
    -- Le réparateur peut voir tous les devis
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- Seul le réparateur peut créer des devis
CREATE POLICY "Repairers can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- Le réparateur peut modifier les devis avec status "pending"
-- Les clients peuvent modifier le status pour accepter ou refuser
CREATE POLICY "Repairers can update pending quotes and clients can update status"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (
    -- Le réparateur peut modifier ses devis "pending"
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'repairer'
      )
      AND quotes.status = 'pending'
    )
    OR
    -- Le client peut modifier le status de ses devis
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = quotes.request_id
      AND requests.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Le réparateur peut modifier ses devis "pending"
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'repairer'
      )
    )
    OR
    -- Le client peut modifier le status de ses devis
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = quotes.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Seul le réparateur peut supprimer des devis
CREATE POLICY "Repairers can delete quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- =====================================================
-- POLITIQUES POUR LA TABLE PAYMENTS
-- =====================================================

-- Les clients peuvent voir les paiements de leurs devis
-- Le réparateur peut voir tous les paiements
CREATE POLICY "Users can view their payments and repairers can view all"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    -- Le client peut voir les paiements de ses devis
    EXISTS (
      SELECT 1 FROM quotes
      INNER JOIN requests ON requests.id = quotes.request_id
      WHERE quotes.id = payments.quote_id
      AND requests.user_id = auth.uid()
    )
    OR
    -- Le réparateur peut voir tous les paiements
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- Les clients peuvent créer un paiement pour leurs devis acceptés
CREATE POLICY "Users can create payments for their accepted quotes"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      INNER JOIN requests ON requests.id = quotes.request_id
      WHERE quotes.id = payments.quote_id
      AND requests.user_id = auth.uid()
      AND quotes.status = 'accepted'
    )
  );

-- Le réparateur peut mettre à jour le status du paiement
CREATE POLICY "Repairers can update payment status"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- Personne ne peut supprimer un paiement (intégrité financière)
-- Pas de politique DELETE = personne ne peut supprimer

-- =====================================================
-- MISE À JOUR DES POLITIQUES EXISTANTES POUR REQUESTS
-- =====================================================

-- Supprimer l'ancienne politique SELECT et en créer une nouvelle
DROP POLICY IF EXISTS "Users can view their own requests" ON requests;

-- Nouvelle politique: Les clients voient leurs demandes, le réparateur voit toutes les demandes
CREATE POLICY "Users can view their requests and repairers can view all"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    -- Le client peut voir ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur peut voir toutes les demandes
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- Supprimer l'ancienne politique UPDATE et en créer une nouvelle
DROP POLICY IF EXISTS "Users can update their own requests" ON requests;

-- Nouvelle politique: Les clients peuvent modifier leurs demandes, le réparateur peut modifier le status
CREATE POLICY "Users can update their requests and repairers can update status"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Le client peut modifier ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur peut modifier toutes les demandes (principalement le status)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  )
  WITH CHECK (
    -- Le client peut modifier ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur peut modifier toutes les demandes
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- =====================================================
-- MISE À JOUR DES POLITIQUES POUR REQUEST_PHOTOS
-- =====================================================

-- Supprimer l'ancienne politique SELECT et en créer une nouvelle
DROP POLICY IF EXISTS "Users can view photos of their requests" ON request_photos;

-- Nouvelle politique: Les clients voient les photos de leurs demandes, le réparateur voit toutes les photos
CREATE POLICY "Users can view their photos and repairers can view all"
  ON request_photos
  FOR SELECT
  TO authenticated
  USING (
    -- Le client peut voir les photos de ses demandes
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_photos.request_id
      AND requests.user_id = auth.uid()
    )
    OR
    -- Le réparateur peut voir toutes les photos
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );
