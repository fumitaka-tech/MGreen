-- growth_log_photos の SELECT を確実に通す（読み取り用 RPC 不要）

drop policy if exists "Members can view growth log photos" on growth_log_photos;

create policy "Members can view growth log photos"
  on growth_log_photos for select
  using (
    exists (
      select 1
      from growth_logs gl
      join plants p on p.id = gl.plant_id
      join areas a on a.id = p.area_id
      where gl.id = growth_log_photos.growth_log_id
        and a.household_id in (select public.user_household_ids())
    )
  );

-- 複数写真の保存（JSONB 版）※未実行の場合のみ
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

drop function if exists public.create_growth_log_with_photos(uuid, text, timestamptz, text[]);

grant execute on function public.create_growth_log_with_photos(uuid, text, timestamptz, jsonb) to authenticated;

-- PostgREST のスキーマキャッシュを更新
notify pgrst, 'reload schema';
