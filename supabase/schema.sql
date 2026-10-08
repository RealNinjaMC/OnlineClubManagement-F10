create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  role text not null default 'member' check (role in ('member', 'host', 'root')),
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  category text not null check (char_length(category) between 1 and 30),
  description text not null check (char_length(description) between 1 and 500),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  host_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.memberships (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'member')),
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  date date not null,
  time time not null,
  room text not null check (char_length(room) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  primary key (event_id, user_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create index on public.memberships (user_id);
create index on public.events (club_id);
create index on public.rsvps (user_id);
create index on public.announcements (club_id);
create index on public.announcements (author_id);
create index on public.feedback (user_id);
create index on public.clubs (host_id);

create function public.my_role() returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.can_host() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.my_role() in ('host', 'root'), false)
$$;

create function public.is_host_of(club uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.clubs c
    join public.profiles p on p.id = auth.uid()
    where c.id = club and (p.role = 'root' or (p.role = 'host' and c.host_id = p.id))
  )
$$;

create function public.is_member_of(club uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where club_id = club and user_id = auth.uid() and status = 'member'
  )
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 40)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.clear_rsvps() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.rsvps r
  using public.events e
  where r.event_id = e.id and e.club_id = old.club_id and r.user_id = old.user_id;
  return old;
end;
$$;

create trigger memberships_clear_rsvps
after delete on public.memberships
for each row execute function public.clear_rsvps();

create function public.list_users()
returns table (id uuid, name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'root' then
    raise exception 'Only the root user can see all users';
  end if;
  return query
    select p.id, p.name, u.email::text, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

create function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'root' then
    raise exception 'Only the root user can change roles';
  end if;
  if new_role not in ('member', 'host') then
    raise exception 'Role must be member or host';
  end if;
  if target = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  update public.profiles set role = new_role where id = target and role <> 'root';
  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

revoke execute on all functions in schema public from public, anon;
revoke execute on function public.handle_new_user(), public.clear_rsvps() from authenticated;
grant execute on function public.my_role(), public.can_host(), public.is_host_of(uuid), public.is_member_of(uuid),
  public.list_users(), public.set_role(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.memberships enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.announcements enable row level security;
alter table public.feedback enable row level security;

revoke all on public.profiles, public.clubs, public.memberships, public.events, public.rsvps,
  public.announcements, public.feedback from anon, authenticated;

grant select on public.profiles, public.clubs, public.memberships, public.events, public.rsvps,
  public.announcements, public.feedback to authenticated;
grant update (name) on public.profiles to authenticated;
grant insert (name, category, description, tags, color), delete on public.clubs to authenticated;
grant insert (club_id), update (status), delete on public.memberships to authenticated;
grant insert (club_id, title, date, time, room) on public.events to authenticated;
grant insert (event_id), delete on public.rsvps to authenticated;
grant insert (club_id, text) on public.announcements to authenticated;
grant insert (club_id, rating, text) on public.feedback to authenticated;

create policy "Signed in users can see profiles" on public.profiles
for select to authenticated using (true);

create policy "Users can rename themselves" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Signed in users can see clubs" on public.clubs
for select to authenticated using (true);

create policy "Hosts can create their own clubs" on public.clubs
for insert to authenticated with check (host_id = auth.uid() and public.can_host());

create policy "Hosts can delete clubs they run" on public.clubs
for delete to authenticated using (public.is_host_of(id));

create policy "Signed in users can see memberships" on public.memberships
for select to authenticated using (true);

create policy "Users can request to join" on public.memberships
for insert to authenticated with check (user_id = auth.uid() and status = 'requested');

create policy "Hosts can approve requests" on public.memberships
for update to authenticated using (public.is_host_of(club_id)) with check (public.is_host_of(club_id) and status = 'member');

create policy "Users can leave and hosts can remove" on public.memberships
for delete to authenticated using (user_id = auth.uid() or public.is_host_of(club_id));

create policy "Signed in users can see events" on public.events
for select to authenticated using (true);

create policy "Hosts can add events" on public.events
for insert to authenticated with check (public.is_host_of(club_id));

create policy "Signed in users can see rsvps" on public.rsvps
for select to authenticated using (true);

create policy "Members can rsvp" on public.rsvps
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.events e where e.id = event_id and public.is_member_of(e.club_id))
);

create policy "Users can cancel their rsvp" on public.rsvps
for delete to authenticated using (user_id = auth.uid());

create policy "Signed in users can see announcements" on public.announcements
for select to authenticated using (true);

create policy "Hosts can post announcements" on public.announcements
for insert to authenticated with check (author_id = auth.uid() and public.is_host_of(club_id));

create policy "Signed in users can see feedback" on public.feedback
for select to authenticated using (true);

create policy "Members can leave feedback once" on public.feedback
for insert to authenticated with check (user_id = auth.uid() and public.is_member_of(club_id));
