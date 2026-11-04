-- Mail « Nouvelle actualité chez Bigger Boat » : dès qu'une actualité est publiée, la base envoie son contenu
-- à un webhook Make (scénario Make + module Gmail). L'adresse du webhook est un secret : elle n'est pas dans le code,
-- elle se range dans private.app_settings (clé make_news_webhook). Sans adresse, rien n'est envoyé.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS emailed_at timestamptz;
-- Les actualités déjà publiées ne déclenchent aucun mail.
UPDATE public.news SET emailed_at = now() WHERE status = 'publiée' AND emailed_at IS NULL;

CREATE TABLE IF NOT EXISTS private.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
REVOKE ALL ON private.app_settings FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION private.notify_news_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions'
AS $function$
DECLARE
  _url text;
  _app text;
  _subject constant text := 'Nouvelle actualité chez Bigger Boat';
  _excerpt text;
  _esc text;
  _html text;
BEGIN
  IF NEW.status = 'publiée'::public.news_status
     AND (TG_OP = 'INSERT' OR OLD.status <> 'publiée'::public.news_status)
     AND NEW.emailed_at IS NULL THEN
    BEGIN
      SELECT value INTO _url FROM private.app_settings WHERE key = 'make_news_webhook';
      IF coalesce(_url, '') <> '' THEN
        SELECT value INTO _app FROM private.app_settings WHERE key = 'app_url';
        _excerpt := btrim(coalesce(NEW.body, ''));
        IF length(_excerpt) > 600 THEN _excerpt := rtrim(left(_excerpt, 600)) || '…'; END IF;
        -- échappement HTML puis sauts de ligne
        _esc := replace(replace(replace(replace(_excerpt, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
        _esc := replace(replace(_esc, E'\n\n', '</p><p style="margin:0 0 12px;line-height:1.5">'), E'\n', '<br>');
        _html := '<div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1B1C1C">'
          || '<div style="background:#6E2470;color:#fff;border-radius:12px 12px 0 0;padding:20px 24px"><h1 style="margin:0;font-size:22px">' || _subject || '</h1></div>'
          || '<div style="background:#fff;border:1px solid #D9D9D4;border-top:0;border-radius:0 0 12px 12px;padding:24px">'
          || '<h2 style="margin:0 0 4px;font-size:20px">' || replace(replace(replace(NEW.title, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</h2>'
          || '<p style="margin:0 0 16px;color:#5F6060;font-size:14px">Publiée par ' || replace(replace(replace(NEW.author, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
          || '<p style="margin:0 0 12px;line-height:1.5">' || _esc || '</p>'
          || CASE WHEN coalesce(_app, '') <> ''
                  THEN '<p style="margin:20px 0 0"><a href="' || _app || '" style="display:inline-block;background:#6E2470;color:#fff;text-decoration:none;border-radius:8px;padding:12px 20px;font-weight:bold">Lire dans Happy Place</a></p>'
                  ELSE '' END
          || '</div></div>';
        PERFORM net.http_post(
          url := _url,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object(
            'news_id', NEW.id,
            'subject', _subject,
            'title', NEW.title,
            'author', NEW.author,
            'excerpt', _excerpt,
            'html', _html
          )
        );
        NEW.emailed_at := now();  -- un seul envoi par actualité
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- un souci d'envoi ne doit jamais empêcher la publication
      RAISE WARNING 'notify_news_published : %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION private.notify_news_published() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS notify_news_published ON public.news;
CREATE TRIGGER notify_news_published
  BEFORE INSERT OR UPDATE OF status ON public.news
  FOR EACH ROW EXECUTE FUNCTION private.notify_news_published();
