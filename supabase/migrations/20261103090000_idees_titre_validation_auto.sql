-- Tranche 2 : parcours des idées
-- 1. Titre de l'idée (« Votre idée »), obligatoire pour les collaborateurs et les managers.
-- 2. Une idée soumise par un manager est validée automatiquement.
-- 3. Pièce jointe : PDF ou image (jpeg, png, webp).

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_title_length_check;
ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_title_length_check CHECK (title IS NULL OR char_length(btrim(title)) BETWEEN 1 AND 120);

CREATE OR REPLACE FUNCTION private.set_submission_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
DECLARE
  _email text := lower(auth.jwt() ->> 'email');
  _role public.app_role;
  _team text;
  _uid uuid;
  _chosen text;
BEGIN
  NEW.submitted_by_email := _email;
  SELECT r.role, u.team, u.id INTO _role, _team, _uid
  FROM public.allowed_users u
  LEFT JOIN public.allowed_user_roles r ON r.allowed_user_id = u.id
  WHERE u.email = _email;
  IF _role IN ('collaborateur', 'manager') AND (NEW.title IS NULL OR btrim(NEW.title) = '') THEN
    RAISE EXCEPTION 'Le titre de l''idée est obligatoire.';
  END IF;
  IF _role = 'collaborateur' THEN
    IF _team IS NULL OR btrim(_team) = '' THEN
      RAISE EXCEPTION 'Aucune équipe n''est associée à ton compte. Contacte un administrateur.';
    END IF;
    NEW.team := _team;
  ELSIF _role = 'manager' THEN
    SELECT mt.team INTO _chosen FROM public.manager_teams mt
     WHERE mt.allowed_user_id = _uid AND lower(btrim(mt.team)) = lower(btrim(coalesce(NEW.team, '')))
     LIMIT 1;
    IF _chosen IS NULL THEN
      RAISE EXCEPTION 'Choisis une de tes équipes pour cette demande.';
    END IF;
    NEW.team := _chosen;
    -- Validation automatique (ce trigger passe après set_revalidate_at : on pose l'échéance ici).
    NEW.status := 'validée';
    NEW.rejection_category := NULL;
    NEW.rejection_note := NULL;
    NEW.revalidate_at := now() + interval '1 year';
  ELSIF _role = 'admin' THEN
    NEW.team := 'Admin';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION private.enforce_submission_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
BEGIN
  IF private.current_app_role() = 'manager'::public.app_role THEN
    IF NEW.author_name IS DISTINCT FROM OLD.author_name
       OR NEW.team IS DISTINCT FROM OLD.team
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.status NOT IN ('validée'::public.submission_status, 'refusée'::public.submission_status)
       OR OLD.status <> 'en attente'::public.submission_status
       OR NOT private.can_review_team(OLD.team) THEN
      RAISE EXCEPTION 'Un manager peut uniquement valider ou refuser une soumission en attente de ses équipes';
    END IF;
  END IF;
  RETURN NEW;
END
$function$;

-- Le trigger fixe le statut d'un manager à « validée » : la politique d'insertion doit l'accepter.
DROP POLICY IF EXISTS "Allowed create pending submissions" ON public.submissions;
CREATE POLICY "Allowed create pending submissions"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
  private.is_allowed()
  AND (
    status = 'en attente'::public.submission_status
    OR (status = 'validée'::public.submission_status AND private.current_app_role() = 'manager'::public.app_role)
  )
);

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'submission-attachments';

DROP POLICY IF EXISTS "Allowed users upload own submission PDF" ON storage.objects;
CREATE POLICY "Allowed users upload own submission PDF"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'submission-attachments'
  AND private.is_allowed()
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);
