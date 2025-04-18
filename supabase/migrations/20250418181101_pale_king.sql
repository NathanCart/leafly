/*
  # Plant collection and care tables

  1. New Tables
    - `plants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `nickname` (text)
      - `image_url` (text)
      - `location` (text)
      - `health_status` (text)
      - `acquisition_date` (date)
      - `notes` (text)
      - `is_favorite` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `care_schedule`
      - `id` (uuid, primary key)
      - `plant_id` (uuid, references plants)
      - `action` (text)
      - `scheduled_date` (date)
      - `scheduled_time` (time)
      - `completed` (boolean)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - CRUD operations on their own plants
      - CRUD operations on their plants' care schedules
*/

create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  nickname text,
  image_url text,
  location text,
  health_status text,
  acquisition_date date,
  notes text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.care_schedule (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references public.plants on delete cascade not null,
  action text not null,
  scheduled_date date not null,
  scheduled_time time,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.plants enable row level security;
alter table public.care_schedule enable row level security;

-- Plants policies
create policy "Users can read own plants"
  on plants
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create plants"
  on plants
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own plants"
  on plants
  for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own plants"
  on plants
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Care schedule policies
create policy "Users can read own care schedules"
  on care_schedule
  for select
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can create care schedules"
  on care_schedule
  for insert
  to authenticated
  with check (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can update own care schedules"
  on care_schedule
  for update
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can delete own care schedules"
  on care_schedule
  for delete
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

-- Set up realtime
alter publication supabase_realtime add table plants;
alter publication supabase_realtime add table care_schedule;

-- Storage for plant images
insert into storage.buckets (id, name, public) 
values ('plants', 'plants', true);

create policy "Plant images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'plants' );

create policy "Users can upload plant images"
  on storage.objects for insert
  with check ( bucket_id = 'plants' AND auth.uid() = owner );