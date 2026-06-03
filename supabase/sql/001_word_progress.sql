-- Create word_progress table for storing user vocabulary progress
create table if not exists public.word_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id text not null,

  -- Core progress counts
  correct_count integer not null default 0 check (correct_count >= 0),
  wrong_count integer not null default 0 check (wrong_count >= 0),

  -- Question type tracking
  practiced_types text[] not null default '{}',
  correct_types text[] not null default '{}',

  -- Word mastery status
  status text not null default 'new'
    check (status in ('new', 'learning', 'strong', 'mastered')),

  -- Timing and review tracking
  last_practiced_at timestamptz,
  last_wrong_at timestamptz,
  mastered_at timestamptz,

  -- Spaced repetition fields
  next_review_at timestamptz,
  review_level integer not null default 0 check (review_level >= 0 and review_level <= 5),
  review_count integer not null default 0 check (review_count >= 0),

  -- Timestamps for auditing
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, word_id)
);

-- Create indexes for common queries
create index if not exists idx_word_progress_user_status
on public.word_progress (user_id, status);

create index if not exists idx_word_progress_user_next_review
on public.word_progress (user_id, next_review_at);

-- Create function to automatically update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger to call set_updated_at function before any update
drop trigger if exists set_word_progress_updated_at on public.word_progress;
create trigger set_word_progress_updated_at
before update on public.word_progress
for each row
execute function public.set_updated_at();

-- Enable Row Level Security (RLS)
alter table public.word_progress enable row level security;

-- RLS Policy: Users can only read their own word progress
drop policy if exists "Users can read own word progress" on public.word_progress;
create policy "Users can read own word progress"
on public.word_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

-- RLS Policy: Users can only insert their own word progress
drop policy if exists "Users can insert own word progress" on public.word_progress;
create policy "Users can insert own word progress"
on public.word_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- RLS Policy: Users can only update their own word progress
drop policy if exists "Users can update own word progress" on public.word_progress;
create policy "Users can update own word progress"
on public.word_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- RLS Policy: Users can only delete their own word progress
drop policy if exists "Users can delete own word progress" on public.word_progress;
create policy "Users can delete own word progress"
on public.word_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);
