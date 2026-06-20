-- MGreen Phase 1: エリア・植物・成長記録

-- 世帯（家族共有）
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'わが家',
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- エリア（屋外・室内）
create table areas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('outdoor', 'indoor')),
  description text,
  created_at timestamptz not null default now()
);

-- 植物
create table plants (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  nickname text not null,
  species_name text,
  planted_at date,
  notes text,
  created_at timestamptz not null default now()
);

-- 成長記録
create table growth_logs (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references plants(id) on delete cascade,
  photo_url text,
  note text,
  logged_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- インデックス
create index idx_household_members_user on household_members(user_id);
create index idx_areas_household on areas(household_id);
create index idx_plants_area on plants(area_id);
create index idx_growth_logs_plant on growth_logs(plant_id);
create index idx_growth_logs_logged_at on growth_logs(logged_at desc);

-- RLS 有効化
alter table households enable row level security;
alter table household_members enable row level security;
alter table areas enable row level security;
alter table plants enable row level security;
alter table growth_logs enable row level security;

-- ユーザーが所属する世帯 ID を返すヘルパー
create or replace function public.user_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid();
$$;

-- 世帯作成（RLS を bypass して household + member を原子的に作成）
create or replace function public.create_household_for_user(
  household_name text default 'わが家'
)
returns table (id uuid, name text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
    select h.id, h.name, h.created_at
    from households h
    join household_members hm on hm.household_id = h.id
    where hm.user_id = auth.uid()
    limit 1;

  if found then
    return;
  end if;

  insert into households (name)
  values (household_name)
  returning households.id into new_household_id;

  insert into household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner');

  return query
    select h.id, h.name, h.created_at
    from households h
    where h.id = new_household_id;
end;
$$;

grant execute on function public.create_household_for_user(text) to authenticated;

-- households
create policy "Members can view their households"
  on households for select
  using (id in (select public.user_household_ids()));

create policy "Members can update their households"
  on households for update
  using (id in (select public.user_household_ids()));

create policy "Users can create households"
  on households for insert
  with check (true);

-- household_members
create policy "Members can view household members"
  on household_members for select
  using (household_id in (select public.user_household_ids()));

create policy "Users can join households"
  on household_members for insert
  with check (user_id = auth.uid());

-- areas
create policy "Members can view areas"
  on areas for select
  using (household_id in (select public.user_household_ids()));

create policy "Members can create areas"
  on areas for insert
  with check (household_id in (select public.user_household_ids()));

create policy "Members can update areas"
  on areas for update
  using (household_id in (select public.user_household_ids()));

create policy "Members can delete areas"
  on areas for delete
  using (household_id in (select public.user_household_ids()));

-- plants
create policy "Members can view plants"
  on plants for select
  using (
    area_id in (
      select id from areas where household_id in (select public.user_household_ids())
    )
  );

create policy "Members can create plants"
  on plants for insert
  with check (
    area_id in (
      select id from areas where household_id in (select public.user_household_ids())
    )
  );

create policy "Members can update plants"
  on plants for update
  using (
    area_id in (
      select id from areas where household_id in (select public.user_household_ids())
    )
  );

create policy "Members can delete plants"
  on plants for delete
  using (
    area_id in (
      select id from areas where household_id in (select public.user_household_ids())
    )
  );

-- growth_logs
create policy "Members can view growth logs"
  on growth_logs for select
  using (
    plant_id in (
      select p.id from plants p
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

create policy "Members can create growth logs"
  on growth_logs for insert
  with check (
    plant_id in (
      select p.id from plants p
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

create policy "Members can update growth logs"
  on growth_logs for update
  using (
    plant_id in (
      select p.id from plants p
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

create policy "Members can delete growth logs"
  on growth_logs for delete
  using (
    plant_id in (
      select p.id from plants p
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

-- Storage: 植物写真バケット
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

create policy "Members can upload plant photos"
  on storage.objects for insert
  with check (
    bucket_id = 'plant-photos'
    and auth.uid() is not null
  );

create policy "Anyone can view plant photos"
  on storage.objects for select
  using (bucket_id = 'plant-photos');

create policy "Members can update their plant photos"
  on storage.objects for update
  using (
    bucket_id = 'plant-photos'
    and auth.uid() is not null
  );

create policy "Members can delete their plant photos"
  on storage.objects for delete
  using (
    bucket_id = 'plant-photos'
    and auth.uid() is not null
  );
