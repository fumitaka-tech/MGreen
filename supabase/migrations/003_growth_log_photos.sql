-- 成長記録に複数写真を対応

create table growth_log_photos (
  id uuid primary key default gen_random_uuid(),
  growth_log_id uuid not null references growth_logs(id) on delete cascade,
  photo_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_growth_log_photos_log on growth_log_photos(growth_log_id);

-- 既存の単一写真を移行
insert into growth_log_photos (growth_log_id, photo_url, sort_order)
select id, photo_url, 0
from growth_logs
where photo_url is not null;

alter table growth_log_photos enable row level security;

create policy "Members can view growth log photos"
  on growth_log_photos for select
  using (
    growth_log_id in (
      select gl.id
      from growth_logs gl
      join plants p on p.id = gl.plant_id
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

create policy "Members can create growth log photos"
  on growth_log_photos for insert
  with check (
    growth_log_id in (
      select gl.id
      from growth_logs gl
      join plants p on p.id = gl.plant_id
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

create policy "Members can delete growth log photos"
  on growth_log_photos for delete
  using (
    growth_log_id in (
      select gl.id
      from growth_logs gl
      join plants p on p.id = gl.plant_id
      join areas a on a.id = p.area_id
      where a.household_id in (select public.user_household_ids())
    )
  );

-- 成長記録 + 写真を原子的に作成（RLS 回避）
create or replace function public.create_growth_log_with_photos(
  p_plant_id uuid,
  p_note text default null,
  p_logged_at timestamptz default now(),
  p_photo_urls text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_log_id uuid;
  i int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from plants p
    join areas a on a.id = p.area_id
    where p.id = p_plant_id
      and a.household_id in (select public.user_household_ids())
  ) then
    raise exception 'Plant not found or access denied';
  end if;

  insert into growth_logs (plant_id, note, photo_url, logged_at, created_by)
  values (
    p_plant_id,
    p_note,
    case
      when p_photo_urls is not null and array_length(p_photo_urls, 1) > 0
      then p_photo_urls[1]
      else null
    end,
    p_logged_at,
    auth.uid()
  )
  returning id into new_log_id;

  if p_photo_urls is not null then
    for i in 1..coalesce(array_length(p_photo_urls, 1), 0) loop
      insert into growth_log_photos (growth_log_id, photo_url, sort_order)
      values (new_log_id, p_photo_urls[i], i - 1);
    end loop;
  end if;

  return new_log_id;
end;
$$;

grant execute on function public.create_growth_log_with_photos(uuid, text, timestamptz, text[]) to authenticated;
