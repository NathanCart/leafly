/*
  # Update profiles table schema
  
  1. Changes
    - Add email column to profiles table
    - Ensure policies exist for profile access
    - Set up storage for avatars
*/

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS if not already enabled
alter table public.profiles enable row level security;

-- Drop existing policies if they exist to avoid conflicts
drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- Create new policies
create policy "Users can read own profile"
  on profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Set up realtime if not already done
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;

-- Set up storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (
  select 1 from storage.buckets where id = 'avatars'
);

-- Drop existing storage policies if they exist
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;

-- Create storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.uid() = owner );