create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer default 999,
  created_at timestamptz not null default now()
);

create table if not exists public.cooking_times (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer default 999,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredient_units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer default 999,
  created_at timestamptz not null default now()
);

create unique index if not exists meal_types_unique_name_per_owner
on public.meal_types ((coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)), lower(name));

create unique index if not exists cooking_times_unique_name_per_owner
on public.cooking_times ((coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)), lower(name));

create unique index if not exists ingredient_units_unique_name_per_owner
on public.ingredient_units ((coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)), lower(name));

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_type_id uuid references public.meal_types (id) on delete set null,
  cooking_time_id uuid references public.cooking_times (id) on delete set null,
  name text not null,
  image_url text,
  recipes text,
  notes text,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  unit_label text default 'unit',
  on_shopping_list boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ingredients add column if not exists quantity numeric default 1;
alter table public.ingredients add column if not exists unit_label text default 'unit';

create table if not exists public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  planned_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at
before update on public.menu_items
for each row execute procedure public.set_updated_at();

drop trigger if exists set_ingredients_updated_at on public.ingredients;
create trigger set_ingredients_updated_at
before update on public.ingredients
for each row execute procedure public.set_updated_at();

drop trigger if exists set_calendar_entries_updated_at on public.calendar_entries;
create trigger set_calendar_entries_updated_at
before update on public.calendar_entries
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.meal_types enable row level security;
alter table public.cooking_times enable row level security;
alter table public.ingredient_units enable row level security;
alter table public.menu_items enable row level security;
alter table public.ingredients enable row level security;
alter table public.calendar_entries enable row level security;

create policy "Users can read their profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can create their profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can manage their profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Users can read shared or own meal types"
on public.meal_types for select
using (user_id is null or auth.uid() = user_id);

create policy "Users can create own meal types"
on public.meal_types for insert
with check (auth.uid() = user_id);

create policy "Users can update own meal types"
on public.meal_types for update
using (auth.uid() = user_id);

create policy "Users can delete own meal types"
on public.meal_types for delete
using (auth.uid() = user_id);

create policy "Users can read shared or own cooking times"
on public.cooking_times for select
using (user_id is null or auth.uid() = user_id);

create policy "Users can create own cooking times"
on public.cooking_times for insert
with check (auth.uid() = user_id);

create policy "Users can update own cooking times"
on public.cooking_times for update
using (auth.uid() = user_id);

create policy "Users can delete own cooking times"
on public.cooking_times for delete
using (auth.uid() = user_id);

create policy "Users can read shared or own ingredient units"
on public.ingredient_units for select
using (user_id is null or auth.uid() = user_id);

create policy "Users can create own ingredient units"
on public.ingredient_units for insert
with check (auth.uid() = user_id);

create policy "Users can update own ingredient units"
on public.ingredient_units for update
using (auth.uid() = user_id);

create policy "Users can delete own ingredient units"
on public.ingredient_units for delete
using (auth.uid() = user_id);

create policy "Users can manage own menu items"
on public.menu_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own ingredients"
on public.ingredients for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own calendar entries"
on public.calendar_entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into public.meal_types (user_id, name, sort_order)
values
  (null, 'Drink', 1),
  (null, 'Snack', 2),
  (null, 'Breakfast', 3),
  (null, 'Lunch', 4),
  (null, 'Dinner', 5),
  (null, 'Dessert', 6)
on conflict do nothing;

insert into public.cooking_times (user_id, name, sort_order)
values
  (null, 'Instant', 1),
  (null, '15 min', 2),
  (null, '30 min', 3),
  (null, '45 min', 4),
  (null, '1 hr+', 5)
on conflict do nothing;

insert into public.ingredient_units (user_id, name, sort_order)
values
  (null, 'liters', 1),
  (null, 'lbs', 2),
  (null, 'oz', 3),
  (null, 'count', 4),
  (null, 'unit', 5)
on conflict do nothing;
