CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  category text NOT NULL DEFAULT 'general',
  order_id uuid,
  status text NOT NULL DEFAULT 'open',
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  user_unread integer NOT NULL DEFAULT 0,
  admin_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_conversations TO authenticated;
GRANT ALL ON public.support_conversations TO service_role;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv select" ON public.support_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "conv insert" ON public.support_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY "conv update" ON public.support_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.support_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg select" ON public.support_messages FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.support_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "msg insert" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND (
    (is_admin AND public.has_role(auth.uid(),'super_admin')) OR
    (NOT is_admin AND EXISTS (SELECT 1 FROM public.support_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))));
CREATE POLICY "msg update" ON public.support_messages FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.support_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.support_message_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  NEW.body := btrim(NEW.body);
  IF length(NEW.body) = 0 OR length(NEW.body) > 2000 THEN RAISE EXCEPTION 'Mesazhi duhet të ketë 1-2000 karaktere.'; END IF;
  IF NOT NEW.is_admin THEN
    SELECT count(*) INTO n FROM support_messages WHERE sender_id = NEW.sender_id AND created_at > now() - interval '1 minute';
    IF n >= 15 THEN RAISE EXCEPTION 'Shumë mesazhe. Prit pak.'; END IF;
  END IF;
  UPDATE support_conversations SET last_message = left(NEW.body,140), last_message_at = now(),
    user_unread = user_unread + CASE WHEN NEW.is_admin THEN 1 ELSE 0 END,
    admin_unread = admin_unread + CASE WHEN NEW.is_admin THEN 0 ELSE 1 END,
    status = CASE WHEN status = 'resolved' AND NOT NEW.is_admin THEN 'open' ELSE status END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.support_message_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER support_message_guard BEFORE INSERT ON public.support_messages FOR EACH ROW EXECUTE FUNCTION public.support_message_guard();

CREATE TABLE public.support_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'ringing',
  answered_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_calls TO authenticated;
GRANT ALL ON public.support_calls TO service_role;
ALTER TABLE public.support_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call select" ON public.support_calls FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "call insert" ON public.support_calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'ringing');
CREATE POLICY "call update" ON public.support_calls FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.support_call_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF length(btrim(NEW.first_name)) = 0 OR length(btrim(NEW.last_name)) = 0 THEN RAISE EXCEPTION 'Emri dhe mbiemri janë të detyrueshëm.'; END IF;
  IF coalesce(btrim(NEW.phone),'') = '' AND coalesce(btrim(NEW.email),'') = '' THEN RAISE EXCEPTION 'Shëno telefonin ose email-in.'; END IF;
  SELECT count(*) INTO n FROM support_calls WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes';
  IF n >= 5 THEN RAISE EXCEPTION 'Shumë thirrje. Provo më vonë.'; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.support_call_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER support_call_guard BEFORE INSERT ON public.support_calls FOR EACH ROW EXECUTE FUNCTION public.support_call_guard();

CREATE TABLE public.support_call_signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.support_calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_call_signaling TO authenticated;
GRANT ALL ON public.support_call_signaling TO service_role;
ALTER TABLE public.support_call_signaling ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sig select" ON public.support_call_signaling FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.support_calls c WHERE c.id = call_id AND c.user_id = auth.uid()));
CREATE POLICY "sig insert" ON public.support_call_signaling FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND (
  public.has_role(auth.uid(),'super_admin') OR EXISTS (SELECT 1 FROM public.support_calls c WHERE c.id = call_id AND c.user_id = auth.uid())));

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations, public.support_messages, public.support_calls, public.support_call_signaling;