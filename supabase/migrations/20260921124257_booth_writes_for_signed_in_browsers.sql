-- The booth must save photos in a browser where the organizer is signed in too:
-- signed-in uploads and capture inserts run as authenticated, and both policies
-- only covered anon. The check stays the same: an open session admits a write.

alter policy "visitors upload originals to open sessions"
on storage.objects to anon, authenticated;

alter policy "visitors add captures to open sessions"
on public.photo_captures to anon, authenticated;

-- Policy expressions run with the caller's privileges, so authenticated needs
-- the same private helpers anon already has.
grant usage on schema private to authenticated;
grant execute on function private.original_path_is_open(text) to authenticated;
grant execute on function private.session_is_open(uuid) to authenticated;
grant insert on public.photo_captures to authenticated;
