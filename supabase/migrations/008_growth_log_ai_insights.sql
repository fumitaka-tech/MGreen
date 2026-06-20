-- 成長記録に AI 解析結果を保存

alter table public.growth_logs
  add column if not exists ai_insights jsonb;

create or replace function public.create_growth_log_with_photos(
  p_plant_id uuid,
  p_note text default null,
  p_logged_at timestamptz default now(),
  p_photo_urls_json jsonb default '[]'::jsonb,
  p_ai_insights_json jsonb default null
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

  insert into growth_logs (plant_id, note, photo_url, logged_at, created_by, ai_insights)
  values (
    p_plant_id,
    p_note,
    case
      when array_length(photo_urls, 1) > 0 then photo_urls[1]
      else null
    end,
    p_logged_at,
    auth.uid(),
    p_ai_insights_json
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

grant execute on function public.create_growth_log_with_photos(uuid, text, timestamptz, jsonb, jsonb) to authenticated;

drop function if exists public.create_growth_log_with_photos(uuid, text, timestamptz, jsonb);

create or replace function public.update_growth_log_with_photos(
  p_log_id uuid,
  p_plant_id uuid,
  p_note text default null,
  p_logged_at timestamptz default now(),
  p_photos_json jsonb default '[]'::jsonb,
  p_ai_insights_json jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  photo jsonb;
  v_photo_id uuid;
  v_photo_url text;
  kept_ids uuid[] := '{}';
  i int := 0;
  first_url text := null;
  photo_count int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from growth_logs gl
    join plants p on p.id = gl.plant_id
    join areas a on a.id = p.area_id
    where gl.id = p_log_id
      and gl.plant_id = p_plant_id
      and a.household_id in (select public.user_household_ids())
  ) then
    raise exception 'Growth log not found or access denied';
  end if;

  select jsonb_array_length(p_photos_json) into photo_count;
  if photo_count is null or photo_count < 1 then
    raise exception '写真は1枚以上必要です';
  end if;

  for photo in select * from jsonb_array_elements(p_photos_json)
  loop
    v_photo_url := photo ->> 'url';
    if v_photo_url is null or v_photo_url = '' then
      raise exception 'Invalid photo url';
    end if;

    if first_url is null then
      first_url := v_photo_url;
    end if;

    if photo ? 'id' and (photo ->> 'id') is not null and (photo ->> 'id') != '' then
      v_photo_id := (photo ->> 'id')::uuid;
      update growth_log_photos glp
      set sort_order = i, photo_url = v_photo_url
      where glp.id = v_photo_id and glp.growth_log_id = p_log_id;

      if not found then
        raise exception 'Photo not found';
      end if;

      kept_ids := array_append(kept_ids, v_photo_id);
    else
      insert into growth_log_photos (growth_log_id, photo_url, sort_order)
      values (p_log_id, v_photo_url, i);
    end if;

    i := i + 1;
  end loop;

  delete from growth_log_photos glp
  where glp.growth_log_id = p_log_id
    and not (glp.id = any(kept_ids));

  update growth_logs gl
  set
    note = p_note,
    logged_at = p_logged_at,
    photo_url = first_url,
    ai_insights = coalesce(p_ai_insights_json, gl.ai_insights)
  where gl.id = p_log_id;
end;
$$;

grant execute on function public.update_growth_log_with_photos(uuid, uuid, text, timestamptz, jsonb, jsonb) to authenticated;

drop function if exists public.update_growth_log_with_photos(uuid, uuid, text, timestamptz, jsonb);

notify pgrst, 'reload schema';
