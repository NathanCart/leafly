/*
  # Add plant images table for progress tracking

  1. New Tables
    - `plant_images`
      - `id` (uuid, primary key)
      - `plant_id` (uuid, references plants)
      - `image_url` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on plant_images table
    - Add policies for authenticated users to:
      - CRUD operations on their own plant images
*/

create table if not exists public.plant_images (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references public.plants on delete cascade not null,
  image_url text not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.plant_images enable row level security;

-- Plant images policies
create policy "Users can read own plant images"
  on plant_images
  for select
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can create plant images"
  on plant_images
  for insert
  to authenticated
  with check (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can update own plant images"
  on plant_images
  for update
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

create policy "Users can delete own plant images"
  on plant_images
  for delete
  to authenticated
  using (
    plant_id in (
      select id from plants where user_id = auth.uid()
    )
  );

-- Set up realtime
alter publication supabase_realtime add table plant_images;