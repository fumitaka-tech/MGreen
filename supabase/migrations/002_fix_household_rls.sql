-- 世帯作成時の RLS 問題を修正
-- households への INSERT + SELECT 返却時に、まだ household_members に
-- 登録されていないため SELECT ポリシーに引っかかる問題を解消する

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

  -- 既に世帯に所属している場合はそれを返す
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
