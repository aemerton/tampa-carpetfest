-- Lets admins edit any attendee's profile and photos (the "Manage" button).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- Admins can update any profile. The column rules from 0001 still apply,
-- so nobody can change the admin flag from the app.
create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Removing a photo file requires being able to see its record, so people
-- can see the records for their own folder.
create policy "Users can see their own photo records"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Admins can add, replace, and remove photos in anyone's folder.
create policy "Admins can manage all photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()))
  with check (bucket_id = 'photos' and (select public.is_admin()));
