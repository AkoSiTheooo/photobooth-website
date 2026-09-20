-- PhotoToy: the originals archive for the photobooth.
-- Anonymous visitors can only add captures to a session the server just opened.
-- Only signed-in admin accounts can read or delete anything.

create table public.photo_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  layout text not null default 'strip4' check (layout in ('strip4')),
  photo_count smallint not null default 4 check (photo_count between 1 and 8),
  mirror boolean not null default true,
  open_until timestamptz not null default now() + interval '2 hours',
  ip_hash text
);

comment on table public.photo_sessions is
  'One visit to the booth. The server creates it and uploads stop after open_until.';

create index photo_sessions_created_at_idx on public.photo_sessions (created_at desc);
create index photo_sessions_ip_created_idx on public.photo_sessions (ip_hash, created_at desc);

create table public.photo_captures (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.photo_sessions (id) on delete cascade,
  shot_index smallint not null check (shot_index between 1 and 8),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (session_id, shot_index)
);

create index photo_captures_session_id_idx on public.photo_captures (session_id);

create schema if not exists private;

-- Security definer because anon has no read access to the tables it checks.
create or replace function private.session_is_open(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.photo_sessions s
    where s.id = p_session_id
      and s.open_until > now()
  );
$$;

-- storage.foldername returns a 1-based array, so the session id in
-- sessions/<id>/shot-1.jpg is element 2.
create or replace function private.original_path_is_open(p_object_name text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.photo_sessions s
    where s.id::text = (storage.foldername(p_object_name))[2]
      and s.open_until > now()
  );
$$;

-- The Data API never exposes the private schema, so these cannot be called
-- directly; anon holds execute only because the policies below run as anon.
revoke all on function private.session_is_open(uuid) from public;
revoke all on function private.original_path_is_open(text) from public;
grant usage on schema private to anon;
grant execute on function private.session_is_open(uuid) to anon;
grant execute on function private.original_path_is_open(text) to anon;

alter table public.photo_sessions enable row level security;
alter table public.photo_captures enable row level security;

grant insert on public.photo_captures to anon;
grant select, delete on public.photo_sessions to authenticated;
grant select, delete on public.photo_captures to authenticated;

create policy "visitors add captures to open sessions"
on public.photo_captures
for insert
to anon
with check (private.session_is_open(session_id));

-- Admin accounts only. Public signup is disabled in Auth settings, so the
-- authenticated role is the organizer.
create policy "admin reads sessions"
on public.photo_sessions for select to authenticated using (true);

create policy "admin reads captures"
on public.photo_captures for select to authenticated using (true);

create policy "admin deletes captures"
on public.photo_captures for delete to authenticated using (true);

create policy "admin deletes sessions"
on public.photo_sessions for delete to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('originals', 'originals', false, 10485760, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "visitors upload originals to open sessions"
on storage.objects for insert to anon
with check (bucket_id = 'originals' and private.original_path_is_open(name));

create policy "admin reads originals"
on storage.objects for select to authenticated
using (bucket_id = 'originals');

create policy "admin deletes originals"
on storage.objects for delete to authenticated
using (bucket_id = 'originals');
