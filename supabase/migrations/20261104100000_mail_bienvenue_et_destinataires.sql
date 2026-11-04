-- Adresse mail facultative à l'inscription : elle sert (1) à envoyer un mail de bienvenue une seule fois,
-- (2) à alimenter la liste des destinataires du mail « Nouvelle actualité chez Bigger Boat ».
-- Visible uniquement par la personne et par les admins (règles de allowed_users).
ALTER TABLE public.allowed_users
  ADD COLUMN IF NOT EXISTS contact_email text
    CHECK (contact_email IS NULL OR (contact_email = lower(contact_email) AND length(contact_email) <= 254
           AND contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz;

-- Mail de bienvenue : envoyé au webhook Make « make_welcome_webhook » (private.app_settings), une seule fois par adresse.
CREATE OR REPLACE FUNCTION private.send_welcome_mail(_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions'
AS $function$
DECLARE
  _u record;
  _url text;
  _app text;
  _role text;
  _team text;
  _name text;
  _html text;
  _todo text;
  _subject constant text := 'Bienvenue chez Bigger Boat';
BEGIN
  SELECT au.contact_email, au.first_name, au.last_name, au.team, au.welcome_sent_at, r.role::text AS role
    INTO _u
    FROM public.allowed_users au
    LEFT JOIN public.allowed_user_roles r ON r.allowed_user_id = au.id
   WHERE au.id = _id;
  IF _u.contact_email IS NULL OR _u.welcome_sent_at IS NOT NULL THEN RETURN; END IF;

  SELECT value INTO _url FROM private.app_settings WHERE key = 'make_welcome_webhook';
  IF coalesce(_url, '') = '' THEN RETURN; END IF;
  SELECT value INTO _app FROM private.app_settings WHERE key = 'app_url';

  _role := coalesce(_u.role, 'collaborateur');
  _team := CASE WHEN _role = 'manager' THEN (SELECT team FROM public.manager_teams WHERE allowed_user_id = _id LIMIT 1)
                WHEN _role = 'admin' THEN NULL ELSE _u.team END;
  _name := replace(replace(replace(coalesce(_u.first_name, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
  _todo := CASE _role
    WHEN 'manager' THEN 'Validez ou refusez les idées de votre équipe, publiez des actualités et suivez les points bloquants.'
    WHEN 'admin' THEN 'Gérez les données du cabinet : rappels de départ, utilisateurs, points bloquants, indicateurs et actualités.'
    ELSE 'Lisez les actualités du cabinet, suivez les indicateurs et soumettez vos idées à votre équipe.' END;

  _html := '<div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1B1C1C">'
    || '<div style="background:#6E2470;color:#fff;border-radius:12px 12px 0 0;padding:20px 24px"><h1 style="margin:0;font-size:22px">' || _subject || '</h1></div>'
    || '<div style="background:#fff;border:1px solid #D9D9D4;border-top:0;border-radius:0 0 12px 12px;padding:24px">'
    || '<h2 style="margin:0 0 12px;font-size:20px">Bonjour ' || _name || ',</h2>'
    || '<p style="margin:0 0 12px;line-height:1.5">Votre profil Happy Place est créé : <strong>'
    || CASE _role WHEN 'manager' THEN 'Manager' WHEN 'admin' THEN 'Admin' ELSE 'Collaborateur' END || '</strong>'
    || CASE WHEN _team IS NOT NULL THEN ', équipe <strong>' || replace(replace(replace(_team, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</strong>' ELSE '' END
    || '.</p>'
    || '<p style="margin:0 0 12px;line-height:1.5">' || _todo || '</p>'
    || '<p style="margin:0 0 12px;line-height:1.5">Vous recevrez un mail à chaque nouvelle actualité publiée chez Bigger Boat.</p>'
    || CASE WHEN coalesce(_app, '') <> ''
            THEN '<p style="margin:20px 0 0"><a href="' || _app || '" style="display:inline-block;background:#6E2470;color:#fff;text-decoration:none;border-radius:8px;padding:12px 20px;font-weight:bold">Ouvrir Happy Place</a></p>'
            ELSE '' END
    || '</div></div>';

  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'to', _u.contact_email,
      'first_name', _u.first_name,
      'last_name', _u.last_name,
      'role', _role,
      'team', _team,
      'subject', _subject,
      'html', _html
    )
  );
  UPDATE public.allowed_users SET welcome_sent_at = now() WHERE id = _id;
END
$function$;
REVOKE ALL ON FUNCTION private.send_welcome_mail(uuid) FROM public, anon, authenticated;

-- Écran « Choisis ton rôle » : nouvel argument facultatif _contact_email.
DROP FUNCTION IF EXISTS public.choisir_mon_role(public.app_role, text, text, text);
CREATE OR REPLACE FUNCTION public.choisir_mon_role(
  _role public.app_role, _first_name text, _last_name text, _team text DEFAULT NULL::text, _contact_email text DEFAULT NULL::text)
 RETURNS public.app_role
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(nullif(auth.jwt() ->> 'email', ''));
  _first text := nullif(btrim(coalesce(_first_name, '')), '');
  _last text := nullif(btrim(coalesce(_last_name, '')), '');
  _t text := nullif(btrim(coalesce(_team, '')), '');
  _mail text := lower(nullif(btrim(coalesce(_contact_email, '')), ''));
  _id uuid;
BEGIN
  IF _uid IS NULL AND _email IS NULL THEN
    RAISE EXCEPTION 'Session introuvable : recharge la page.' USING ERRCODE = '42501';
  END IF;

  -- Compte anonyme : on lui attribue une adresse interne, une fois pour toutes
  IF _email IS NULL THEN
    SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = _uid;
    IF _email IS NULL OR _email = '' THEN
      _email := 'eleve-' || left(replace(_uid::text, '-', ''), 12) || '@happyplace.test';
      UPDATE auth.users SET email = _email WHERE id = _uid;
    END IF;
  END IF;

  IF _role IS NULL THEN
    RAISE EXCEPTION 'Choisis un rôle.';
  END IF;
  IF _first IS NULL OR _last IS NULL THEN
    RAISE EXCEPTION 'Renseigne ton prénom et ton nom.';
  END IF;
  IF _mail IS NOT NULL AND (length(_mail) > 254 OR _mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'Adresse mail invalide.';
  END IF;

  IF _role = 'admin' THEN
    _t := NULL;
  ELSE
    IF _t IS NULL THEN
      RAISE EXCEPTION 'Choisis une équipe.';
    END IF;
    SELECT t.name INTO _t FROM public.teams t
     WHERE lower(t.name) = lower(_t) AND NOT t.is_reserved;
    IF _t IS NULL THEN
      RAISE EXCEPTION 'Équipe inconnue : choisis une équipe de la liste.';
    END IF;
  END IF;

  INSERT INTO public.allowed_users (email, first_name, last_name, team, contact_email)
  VALUES (_email, _first, _last, CASE WHEN _role = 'collaborateur' THEN _t END, _mail)
  ON CONFLICT (email) DO UPDATE
    SET first_name = excluded.first_name,
        last_name = excluded.last_name,
        team = excluded.team,
        -- une nouvelle adresse redonne droit à un mail de bienvenue
        welcome_sent_at = CASE WHEN excluded.contact_email IS DISTINCT FROM public.allowed_users.contact_email
                               THEN NULL ELSE public.allowed_users.welcome_sent_at END,
        contact_email = excluded.contact_email
  RETURNING id INTO _id;

  BEGIN
    INSERT INTO public.allowed_user_roles (allowed_user_id, role)
    VALUES (_id, _role)
    ON CONFLICT (allowed_user_id) DO UPDATE
      SET role = excluded.role, updated_at = now();
  EXCEPTION WHEN raise_exception THEN
    RAISE EXCEPTION 'Tu es le dernier admin : un autre membre doit devenir admin avant que tu changes de rôle.';
  END;

  DELETE FROM public.manager_teams WHERE allowed_user_id = _id;
  IF _role = 'manager' THEN
    INSERT INTO public.manager_teams (allowed_user_id, team) VALUES (_id, _t);
  END IF;

  -- Mail de bienvenue : un souci d'envoi ne doit jamais empêcher l'inscription.
  BEGIN
    PERFORM private.send_welcome_mail(_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_welcome_mail : %', SQLERRM;
  END;

  RETURN _role;
END;
$function$;
REVOKE ALL ON FUNCTION public.choisir_mon_role(public.app_role, text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.choisir_mon_role(public.app_role, text, text, text, text) TO authenticated, service_role;

-- Mail « Nouvelle actualité » : le webhook reçoit aussi la liste des adresses (recipients).
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
            'html', _html,
            'recipients', coalesce((SELECT jsonb_agg(DISTINCT contact_email) FROM public.allowed_users WHERE contact_email IS NOT NULL), '[]'::jsonb)
          )
        );
        NEW.emailed_at := now();
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_news_published : %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END
$function$;
