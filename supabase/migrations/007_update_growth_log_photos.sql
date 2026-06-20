-- 成長記録の写真編集（追加・削除・並び替え）
-- photo_url 変数名とカラム名の衝突を修正

create or replace function public.update_growth_log_with_photos(
  p_log_id uuid,
  p_plant_id uuid,
  p_note text default null,
  p_logged_at timestamptz default now(),
  p_photos_json jsonb default '[]'::jsonb
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
    photo_url = first_url
  where gl.id = p_log_id;
end;
$$;

grant execute on function public.update_growth_log_with_photos(uuid, uuid, text, timestamptz, jsonb) to authenticated;

notify pgrst, 'reload schema';
