-- Un départ annoncé crée toujours un rappel pour les admins (et le manager de l'équipe), même si la personne
-- n'a aucun document : l'admin voit « Aucun document à télécharger » et clique sur « J'ai pris note ».
-- Avant, le rappel n'était créé que s'il y avait des documents à télécharger.
CREATE OR REPLACE FUNCTION private.notify_departure(_user_id uuid, _email text, _team text, _date date, _kind text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE _docs jsonb := private.departure_documents(_email);
BEGIN
  UPDATE public.departure_notices SET closed_at = now()
   WHERE departing_user_id = _user_id AND closed_at IS NULL;
  INSERT INTO public.departure_notices (departing_user_id, departing_label, recipient_email, departure_date, kind, documents)
  SELECT _user_id, _email, rcpt, _date, _kind, _docs FROM private.departure_recipients(_email, _team) AS rcpt;
END $function$;
