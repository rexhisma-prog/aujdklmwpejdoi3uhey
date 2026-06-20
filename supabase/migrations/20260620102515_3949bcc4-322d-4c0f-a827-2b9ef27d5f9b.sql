revoke execute on function public.has_role(uuid, app_role) from anon;

drop policy if exists "Public can view active services" on public.services;

create policy "Public can view active services"
on public.services
for select
to anon, authenticated
using (active = true);