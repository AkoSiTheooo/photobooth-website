-- storage.foldername returns a 1-based array, so the session id in
-- sessions/<id>/shot-1.jpg is element 2, not 1. With [1] the policy compared the
-- literal folder name "sessions" and refused every upload.
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
