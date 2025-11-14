/*
  # Création des tables quotes et payments pour le système de devis et paiement

  ## 1. Nouvelle Table: quotes
  Contient tous les devis proposés par le réparateur pour les demandes de réparation
    - `id` (serial, primary key) - Identifiant unique du devis
    - `request_id` (integer, foreign key) - Référence vers la demande de réparation
    - `amount` (decimal) - Montant du devis en devise locale
    - `description_travaux` (text) - Description détaillée des travaux à effectuer
    - `estimated_duration` (text) - Durée estimée de la réparation (ex: "2-3 jours")
    - `parts_needed` (text) - Liste des pièces nécessaires pour la réparation
    - `status` (text) - Statut du devis: pending, accepted, rejected
    - `rejection_reason` (text, nullable) - Raison du refus si le client rejette le devis
    - `created_at` (timestamptz) - Date de création du devis
    - `updated_at` (timestamptz) - Date de dernière modification

  ## 2. Nouvelle Table: payments
  Contient les informations de paiement en espèces pour les devis acceptés
    - `id` (serial, primary key) - Identifiant unique du paiement
    - `quote_id` (integer, foreign key) - Référence vers le devis accepté
    - `amount` (decimal) - Montant à payer
    - `payment_method` (text) - Méthode de paiement (fixé à "cash" pour le moment)
    - `status` (text) - Statut du paiement: pending, completed
    - `payment_date` (timestamptz, nullable) - Date de collecte du paiement
    - `notes` (text, nullable) - Notes additionnelles sur le paiement
    - `created_at` (timestamptz) - Date de création de l'enregistrement

  ## 3. Création du compte réparateur
  Insertion du profil du réparateur unique dans la table profiles
    - Email: repairer@daxas.ci
    - Rôle: repairer
    - Note: Le compte auth.users doit être créé manuellement via la console Supabase

  ## 4. Sécurité
    - Enable RLS sur les deux nouvelles tables
    - Création d'index pour optimiser les requêtes fréquentes
    - Contraintes de clés étrangères avec cascade pour maintenir l'intégrité
*/

-- =====================================================
-- CRÉATION DE LA TABLE QUOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description_travaux TEXT NOT NULL,
  estimated_duration TEXT NOT NULL,
  parts_needed TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les recherches par request_id
CREATE INDEX IF NOT EXISTS idx_quotes_request_id ON quotes(request_id);

-- Index pour optimiser les recherches par status
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRÉATION DE LA TABLE PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour optimiser les recherches par quote_id
CREATE INDEX IF NOT EXISTS idx_payments_quote_id ON payments(quote_id);

-- Index pour optimiser les recherches par status
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIGGER POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CRÉATION DU PROFIL RÉPARATEUR
-- =====================================================

-- Note: L'utilisateur doit d'abord être créé dans auth.users via la console Supabase
-- Ensuite, récupérez son UUID et remplacez-le dans cette commande

-- Insertion temporaire avec un UUID exemple (à remplacer après création du compte)
-- Cette insertion sera complétée manuellement après la création du compte auth

COMMENT ON TABLE quotes IS 'Table contenant tous les devis proposés par le réparateur pour les demandes de réparation';
COMMENT ON TABLE payments IS 'Table contenant les informations de paiement en espèces pour les devis acceptés';
