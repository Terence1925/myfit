-- BUG FIX: workout_programs had select/insert/delete RLS policies but no update policy, so any
-- UPDATE was silently blocked. The "Swap exercise" feature (advertised on every tier) only ever
-- updated local React state — it never persisted, so a swap was lost on refresh or re-open. This
-- adds the missing policy so the newly-added programs.update() call can actually write through.

create policy "programs_update_own_or_admin" on public.workout_programs
  for update using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
