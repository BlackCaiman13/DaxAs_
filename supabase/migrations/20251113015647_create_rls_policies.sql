/*
  # Création des politiques RLS pour toutes les tables
  
  ## Tables concernées
  - devices
  - requests
  - request_photos
  - notifications
  
  ## Politiques créées
  
  ### 1. Table devices (catalogue public d'appareils)
  - SELECT: Tout le monde peut voir les appareils
  - INSERT: Seuls les admins peuvent ajouter des appareils
  - UPDATE: Seuls les admins peuvent modifier des appareils
  - DELETE: Seuls les admins peuvent supprimer des appareils
  
  ### 2. Table requests (demandes de réparation)
  - SELECT: Les utilisateurs peuvent voir leurs propres demandes
  - INSERT: Les utilisateurs authentifiés peuvent créer des demandes
  - UPDATE: Les utilisateurs peuvent modifier leurs propres demandes
  - DELETE: Les utilisateurs peuvent supprimer leurs propres demandes
  
  ### 3. Table request_photos (photos des demandes)
  - SELECT: Les utilisateurs peuvent voir les photos de leurs demandes
  - INSERT: Les utilisateurs peuvent ajouter des photos à leurs demandes
  - DELETE: Les utilisateurs peuvent supprimer les photos de leurs demandes
  
  ### 4. Table notifications (notifications utilisateur)
  - SELECT: Les utilisateurs peuvent voir leurs propres notifications
  - UPDATE: Les utilisateurs peuvent marquer leurs notifications comme lues
  - DELETE: Les utilisateurs peuvent supprimer leurs notifications
  
  ## Sécurité
  Toutes les politiques utilisent auth.uid() pour vérifier l'identité
  et garantir que les utilisateurs n'accèdent qu'à leurs propres données
*/

-- =====================================================
-- POLICIES POUR LA TABLE DEVICES
-- =====================================================

-- Tout le monde peut voir les appareils disponibles (catalogue public)
CREATE POLICY "Anyone can view devices"
  ON devices
  FOR SELECT
  TO public
  USING (true);

-- Seuls les admins peuvent ajouter des appareils
CREATE POLICY "Admins can insert devices"
  ON devices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent modifier des appareils
CREATE POLICY "Admins can update devices"
  ON devices
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des appareils
CREATE POLICY "Admins can delete devices"
  ON devices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- POLICIES POUR LA TABLE REQUESTS
-- =====================================================

-- Les utilisateurs peuvent voir leurs propres demandes
CREATE POLICY "Users can view their own requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs authentifiés peuvent créer des demandes
CREATE POLICY "Authenticated users can create requests"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres demandes
CREATE POLICY "Users can update their own requests"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres demandes
CREATE POLICY "Users can delete their own requests"
  ON requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- POLICIES POUR LA TABLE REQUEST_PHOTOS
-- =====================================================

-- Les utilisateurs peuvent voir les photos de leurs demandes
CREATE POLICY "Users can view photos of their requests"
  ON request_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_photos.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent ajouter des photos à leurs demandes
CREATE POLICY "Users can insert photos to their requests"
  ON request_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_photos.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer les photos de leurs demandes
CREATE POLICY "Users can delete photos of their requests"
  ON request_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = request_photos.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICIES POUR LA TABLE NOTIFICATIONS
-- =====================================================

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
