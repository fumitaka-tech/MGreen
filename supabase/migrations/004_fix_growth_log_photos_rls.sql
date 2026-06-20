-- 成長記録 + 写真の RLS 問題を修正
-- growth_logs / growth_log_photos への INSERT 時に RLS で弾かれる問題を解消

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
