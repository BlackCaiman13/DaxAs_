/*
  # Ajout du Support Multi-Réparateurs
  
  ## 1. Modifications de la Table Quotes
  Ajout d'une colonne pour identifier le réparateur qui a créé chaque devis
    - `repairer_id` (UUID, foreign key vers profiles) - Identifiant du réparateur qui a créé le devis
    - Index sur repairer_id pour optimiser les requêtes
  
  ## 2. Nouvelle Table: Assignments
  Table pour assigner des demandes de réparation à des réparateurs spécifiques
    - `id` (serial, primary key) - Identifiant unique de l'assignation
    - `request_id` (bigint, foreign key vers requests) - Référence vers la demande assignée
    - `repairer_id` (UUID, foreign key vers profiles) - Référence vers le réparateur assigné
    - `assigned_at` (timestamptz) - Date et heure de l'assignation
    - `status` (text) - Statut de l'assignation: active, completed, cancelled
    - `created_at` (timestamptz) - Date de création de l'enregistrement
    - `updated_at` (timestamptz) - Date de dernière modification
  
  ## 3. Mise à Jour des Politiques RLS
  Modification des politiques pour supporter plusieurs réparateurs
    - Chaque réparateur ne voit que ses propres devis
    - Chaque réparateur ne voit que les demandes qui lui sont assignées
    - Les clients continuent à ne voir que leurs propres demandes
  
  ## 4. Sécurité
    - Enable RLS sur la nouvelle table assignments
    - Création d'index pour optimiser les requêtes fréquentes
    - Contraintes de clés étrangères avec cascade pour maintenir l'intégrité
    - Une seule assignation active par demande (unique constraint)
*/

-- =====================================================
-- AJOUT DE LA COLONNE repairer_id DANS LA TABLE QUOTES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'repairer_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN repairer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour optimiser les recherches par repairer_id
CREATE INDEX IF NOT EXISTS idx_quotes_repairer_id ON quotes(repairer_id);

-- =====================================================
-- CRÉATION DE LA TABLE ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  repairer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les recherches par request_id
CREATE INDEX IF NOT EXISTS idx_assignments_request_id ON assignments(request_id);

-- Index pour optimiser les recherches par repairer_id
CREATE INDEX IF NOT EXISTS idx_assignments_repairer_id ON assignments(repairer_id);

-- Index pour optimiser les recherches par status
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- Contrainte unique pour s'assurer qu'une demande n'a qu'une seule assignation active
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_request_active ON assignments(request_id) 
  WHERE status = 'active';

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIGGER POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- =====================================================

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MISE À JOUR DES POLITIQUES RLS POUR QUOTES
-- =====================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view quotes for their requests and repairers can view all" ON quotes;
DROP POLICY IF EXISTS "Repairers can create quotes" ON quotes;
DROP POLICY IF EXISTS "Repairers can update pending quotes and clients can update status" ON quotes;
DROP POLICY IF EXISTS "Repairers can delete quotes" ON quotes;

-- Les clients peuvent voir les devis de leurs demandes
-- Les réparateurs peuvent voir uniquement LEURS propres devis
CREATE POLICY "Users can view quotes for their requests and repairers can view their own"
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
    -- Le réparateur peut voir ses propres devis
    (
      repairer_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'repairer'
      )
    )
  );

-- Seuls les réparateurs peuvent créer des devis (avec leur repairer_id automatique)
CREATE POLICY "Repairers can create their own quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
    AND repairer_id = auth.uid()
  );

-- Le réparateur peut modifier uniquement SES devis "pending"
-- Les clients peuvent modifier le status de leurs devis
CREATE POLICY "Repairers can update their pending quotes and clients can update status"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (
    -- Le réparateur peut modifier ses propres devis "pending"
    (
      repairer_id = auth.uid()
      AND quotes.status = 'pending'
      AND EXISTS (
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
  )
  WITH CHECK (
    -- Le réparateur peut modifier ses propres devis
    (
      repairer_id = auth.uid()
      AND EXISTS (
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

-- Le réparateur peut supprimer uniquement SES propres devis
CREATE POLICY "Repairers can delete their own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (
    repairer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'repairer'
    )
  );

-- =====================================================
-- POLITIQUES RLS POUR LA TABLE ASSIGNMENTS
-- =====================================================

-- Les réparateurs peuvent voir leurs propres assignations
-- Les clients peuvent voir les assignations de leurs demandes
CREATE POLICY "Repairers and clients can view their assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    -- Le réparateur peut voir ses assignations
    repairer_id = auth.uid()
    OR
    -- Le client peut voir les assignations de ses demandes
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = assignments.request_id
      AND requests.user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent créer des assignations
-- Pour l'instant, cette politique permet aussi aux réparateurs de s'auto-assigner si nécessaire
CREATE POLICY "Admins and repairers can create assignments"
  ON assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'repairer')
    )
  );

-- Seuls les réparateurs assignés et les admins peuvent modifier les assignations
CREATE POLICY "Assigned repairers and admins can update assignments"
  ON assignments
  FOR UPDATE
  TO authenticated
  USING (
    repairer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    repairer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des assignations
CREATE POLICY "Only admins can delete assignments"
  ON assignments
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
-- MISE À JOUR DES POLITIQUES POUR REQUESTS
-- =====================================================

-- Supprimer l'ancienne politique SELECT et en créer une nouvelle
DROP POLICY IF EXISTS "Users can view their requests and repairers can view all" ON requests;

-- Nouvelle politique: Les clients voient leurs demandes, les réparateurs voient leurs demandes assignées
CREATE POLICY "Users can view their requests and repairers can view assigned requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    -- Le client peut voir ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur peut voir les demandes qui lui sont assignées
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.request_id = requests.id
      AND assignments.repairer_id = auth.uid()
      AND assignments.status = 'active'
    )
  );

-- Supprimer l'ancienne politique UPDATE
DROP POLICY IF EXISTS "Users can update their requests and repairers can update status" ON requests;

-- Nouvelle politique: Les clients peuvent modifier leurs demandes, les réparateurs assignés peuvent modifier le status
CREATE POLICY "Users can update their requests and assigned repairers can update status"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Le client peut modifier ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur assigné peut modifier le status
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.request_id = requests.id
      AND assignments.repairer_id = auth.uid()
      AND assignments.status = 'active'
    )
  )
  WITH CHECK (
    -- Le client peut modifier ses propres demandes
    auth.uid() = user_id
    OR
    -- Le réparateur assigné peut modifier
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.request_id = requests.id
      AND assignments.repairer_id = auth.uid()
      AND assignments.status = 'active'
    )
  );

-- =====================================================
-- MISE À JOUR DES POLITIQUES POUR REQUEST_PHOTOS
-- =====================================================

-- Supprimer l'ancienne politique SELECT
DROP POLICY IF EXISTS "Users can view their photos and repairers can view all" ON request_photos;

-- Nouvelle politique: Les clients voient leurs photos, les réparateurs assignés voient les photos de leurs demandes
CREATE POLICY "Users can view their photos and assigned repairers can view photos"
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
    -- Le réparateur assigné peut voir les photos de ses demandes
    EXISTS (
      SELECT 1 FROM assignments
      INNER JOIN requests ON requests.id = assignments.request_id
      WHERE requests.id = request_photos.request_id
      AND assignments.repairer_id = auth.uid()
      AND assignments.status = 'active'
    )
  );

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE assignments IS 'Table pour assigner des demandes de réparation à des réparateurs spécifiques';
COMMENT ON COLUMN quotes.repairer_id IS 'Identifiant du réparateur qui a créé ce devis';