-- 複数写真の保存・取得を修正
-- 1. RPC の配列パラメータを JSONB に変更（JS からの配列渡し問題を回避）
-- 2. 写真取得用 RPC を追加（RLS による読み取り漏れを回避）

create or replace function public.create_growth_log_with_photos(
  p_plant_id uuid,
  p_note text default null,
  p_logged_at timestamptz default now(),
  p_photo_urls_json jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_log_id uuid;
  photo_urls text[];
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

  select coalesce(
    array_agg(elem order by ord),
    '{}'::text[]
  )
  into photo_urls
  from jsonb_array_elements_text(p_photo_urls_json) with ordinality as t(elem, ord);

  insert into growth_logs (plant_id, note, photo_url, logged_at, created_by)
  values (
    p_plant_id,
    p_note,
    case
      when array_length(photo_urls, 1) > 0 then photo_urls[1]
      else null
    end,
    p_logged_at,
    auth.uid()
  )
  returning id into new_log_id;

  if photo_urls is not null then
    for i in 1..coalesce(array_length(photo_urls, 1), 0) loop
      insert into growth_log_photos (growth_log_id, photo_url, sort_order)
      values (new_log_id, photo_urls[i], i - 1);
    end loop;
  end if;

  return new_log_id;
end;
$$;

grant execute on function public.create_growth_log_with_photos(uuid, text, timestamptz, jsonb) to authenticated;

-- 旧シグネチャ（text[]）が残っている場合は削除
drop function if exists public.create_growth_log_with_photos(uuid, text, timestamptz, text[]);

create or replace function public.get_growth_log_photos_for_logs(p_log_ids uuid[])
returns table (
  id uuid,
  growth_log_id uuid,
  photo_url text,
  sort_order int,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select glp.id, glp.growth_log_id, glp.photo_url, glp.sort_order, glp.created_at
  from growth_log_photos glp
  join growth_logs gl on gl.id = glp.growth_log_id
  join plants p on p.id = gl.plant_id
  join areas a on a.id = p.area_id
  where glp.growth_log_id = any(p_log_ids)
    and a.household_id in (select public.user_household_ids())
  order by glp.growth_log_id, glp.sort_order;
$$;

grant execute on function public.get_growth_log_photos_for_logs(uuid[]) to authenticated;
