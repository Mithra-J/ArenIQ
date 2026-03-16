create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text,
  role text not null default 'citizen' check (role in ('citizen', 'officer', 'admin')),
  district text,
  created_at timestamptz not null default now()
);

create table if not exists public.waterbodies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  district text not null,
  village text,
  latitude double precision not null,
  longitude double precision not null,
  area_hectares numeric(10,2),
  monitoring_status text not null default 'active',
  last_scanned_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.encroachments (
  id uuid primary key default uuid_generate_v4(),
  waterbody_id uuid references public.waterbodies(id) on delete set null,
  source text not null check (source in ('satellite', 'citizen', 'field')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  area_sq_m numeric(12,2),
  detected_at timestamptz not null default now(),
  satellite_scene_url text,
  notes text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  waterbody_id uuid references public.waterbodies(id) on delete set null,
  encroachment_id uuid references public.encroachments(id) on delete set null,
  title text not null,
  description text not null,
  location_name text,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  image_url text,
  source text not null default 'citizen' check (source in ('citizen', 'satellite', 'field')),
  created_at timestamptz not null default now()
);

insert into public.waterbodies (name, district, village, latitude, longitude, area_hectares, monitoring_status)
values
  ('Porur Lake', 'Chennai', 'Porur', 13.0380, 80.1540, 63.50, 'active'),
  ('Singanallur Lake', 'Coimbatore', 'Singanallur', 10.9984, 77.0221, 91.20, 'active'),
  ('Vandiyur Tank', 'Madurai', 'Vandiyur', 9.9290, 78.1550, 52.10, 'active')
on conflict do nothing;
