-- The only door an anonymous visitor has: opens a session and returns nothing
-- but the fresh id. Security definer because anon has no insert grant on
-- photo_sessions.
--
-- Replaces the rate-limited version from 20260920055113; sessions are no
-- longer counted per IP or globally, so ip_hash goes with the count.

drop function public.start_booth_session(boolean, text);

create function public.start_booth_session(p_mirror boolean)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.photo_sessions (mirror)
  values (coalesce(p_mirror, true))
  returning id;
$$;

alter table public.photo_sessions drop column ip_hash;

revoke all on function public.start_booth_session(boolean) from public;
grant execute on function public.start_booth_session(boolean) to anon;
