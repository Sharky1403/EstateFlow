create table conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references profiles(id),
  landlord_id uuid not null references profiles(id),
  created_at timestamptz default now(),
  unique(tenant_id, landlord_id)
);

create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table direct_messages enable row level security;

create policy "conversation_participants" on conversations for all
  using (tenant_id = auth.uid() or landlord_id = auth.uid());

create policy "direct_message_participants" on direct_messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = direct_messages.conversation_id
      and (c.tenant_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );
