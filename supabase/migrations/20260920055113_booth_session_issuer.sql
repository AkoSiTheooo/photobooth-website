-- The booth's session issuer. Exposed to anon on purpose: it is the only way to
-- create a session, it returns nothing but a fresh id, and it rate limits itself.
create or replace function public.start_booth_session(p_mirror boolean, p_ip_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
  v_global integer;
  v_id uuid;
begin
  if p_ip_hash is null or length(p_ip_hash) < 16 then
    raise exception 'missing_ip_hash';
  end if;

  select count(*) into v_recent
  from public.photo_sessions s
  where s.ip_hash = p_ip_hash
    and s.created_at > now() - interval '1 hour';

  if v_recent >= 12 then
    raise exception 'rate_limited';
  end if;

  -- A caller can pass any hash, so the whole booth gets a cap as well.
  select count(*) into v_global
  from public.photo_sessions s
  where s.created_at > now() - interval '1 hour';

  if v_global >= 240 then
    raise exception 'rate_limited';
  end if;

  insert into public.photo_sessions (mirror, ip_hash)
  values (coalesce(p_mirror, true), p_ip_hash)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.start_booth_session(boolean, text) from public;
grant execute on function public.start_booth_session(boolean, text) to anon;
