create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can read their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Authenticated users can manage mixtapes" on public.mixtapes;
drop policy if exists "Authenticated users can manage events" on public.events;
drop policy if exists "Authenticated users can manage gallery" on public.gallery_items;
drop policy if exists "Admins can manage mixtapes" on public.mixtapes;
drop policy if exists "Admins can manage events" on public.events;
drop policy if exists "Admins can manage gallery" on public.gallery_items;
drop policy if exists "Admins can read bookings" on public.bookings;
drop policy if exists "Admins can update bookings" on public.bookings;

create policy "Admins can manage mixtapes"
  on public.mixtapes for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can manage events"
  on public.events for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can manage gallery"
  on public.gallery_items for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can read bookings"
  on public.bookings for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Admins can update bookings"
  on public.bookings for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
