/*
  # Ajout du champ file_path à la table request_photos
  
  1. Modifications
    - Ajout de la colonne `file_path` à la table `request_photos`
    - Ce champ stocke le chemin du fichier dans le bucket Storage
  
  2. Notes
    - Le champ est nullable pour permettre la rétrocompatibilité
    - Utilise IF NOT EXISTS pour éviter les erreurs si déjà appliqué
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'request_photos' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE request_photos ADD COLUMN file_path text;
  END IF;
END $$;
