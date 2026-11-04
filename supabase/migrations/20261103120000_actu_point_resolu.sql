-- Quand un point bloquant passe au statut RÉSOLU, une actualité est publiée d'office pour informer toute l'entreprise.
-- Une seule actualité par point bloquant : le lien est conservé dans news.blocker_id.
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS blocker_id uuid REFERENCES public.blockers(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS news_blocker_id_key ON public.news (blocker_id) WHERE blocker_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.publish_news_on_blocker_resolved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  _team text := CASE WHEN upper(btrim(NEW.department)) IN ('', 'GENERAL', 'GÉNÉRAL')
                     THEN 'L''équipe concernée'
                     ELSE 'L''équipe ' || btrim(NEW.department) END;
BEGIN
  IF NEW.status = 'RÉSOLU'::public.blocker_status AND OLD.status <> 'RÉSOLU'::public.blocker_status THEN
    INSERT INTO public.news (title, body, author, status, blocker_id)
    VALUES (
      'Point bloquant résolu : ' || NEW.title,
      'Le point bloquant « ' || NEW.title || ' » est résolu.'
        || CASE WHEN coalesce(btrim(NEW.description), '') <> '' THEN E'\n\n' || btrim(NEW.description) ELSE '' END,
      _team,
      'publiée'::public.news_status,
      NEW.id
    )
    ON CONFLICT (blocker_id) WHERE blocker_id IS NOT NULL DO NOTHING;
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION private.publish_news_on_blocker_resolved() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS publish_news_on_blocker_resolved ON public.blockers;
CREATE TRIGGER publish_news_on_blocker_resolved
  AFTER UPDATE OF status ON public.blockers
  FOR EACH ROW EXECUTE FUNCTION private.publish_news_on_blocker_resolved();
