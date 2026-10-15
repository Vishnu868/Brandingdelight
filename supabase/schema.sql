-- BrandingDelight — Supabase schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Auth is handled by Firebase; every write goes through Next.js API routes using the service-role key,
-- so Row Level Security is enabled with NO public policies (the anon key cannot read or write anything).

create extension if not exists pgcrypto;

-- ───────────────────────────── products
create table if not exists public.products (
  id                text primary key,
  slug              text unique not null,
  name              text not null,
  brand             text not null default '',
  category          text not null default '',
  subcategory       text not null default '',
  price             numeric(12,2),
  mrp               numeric(12,2),
  sku               text,
  short_description text not null default '',
  description       text not null default '',
  highlights        jsonb not null default '[]'::jsonb,
  specs             jsonb not null default '[]'::jsonb,
  variants          jsonb not null default '[]'::jsonb,
  images            jsonb not null default '[]'::jsonb,
  tags              jsonb not null default '[]'::jsonb,
  catalog           text not null default '',
  stock             integer not null default 100,
  price_on_request  boolean not null default false,
  featured          boolean not null default false,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_active_idx on public.products (active);

-- ───────────────────────────── categories (optional metadata; categories are derived from products)
create table if not exists public.categories (
  name        text primary key,
  image       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────── orders
create table if not exists public.orders (
  id                   text primary key,
  user_id              text,               -- Firebase uid (null for guest checkout)
  email                text not null,
  phone                text,
  items                jsonb not null,
  subtotal             numeric(12,2) not null,
  shipping             numeric(12,2) not null default 0,
  total                numeric(12,2) not null,
  address              jsonb not null,
  status               text not null default 'pending'
                       check (status in ('pending','paid','processing','shipped','delivered','cancelled','failed','refunded')),
  razorpay_order_id    text unique,
  razorpay_payment_id  text,
  payment_method       text,               -- card / upi / netbanking / wallet / emi
  card_network         text,               -- Visa / MasterCard / American Express / RuPay …
  notes                text,
  tracking_url         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ───────────────────────────── customer profiles (saved addresses)
create table if not exists public.profiles (
  user_id     text primary key,            -- Firebase uid
  email       text,
  phone       text,
  full_name   text,
  addresses   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────── bulk / corporate enquiries
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  email       text not null,
  phone       text not null,
  quantity    text,
  budget      text,
  message     text,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);

-- ───────────────────────────── updated_at triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ───────────────────────────── RLS: deny-all for anon/authenticated (service role bypasses RLS)
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.orders     enable row level security;
alter table public.profiles   enable row level security;
alter table public.enquiries  enable row level security;

-- ───────────────────────────── storage bucket for admin-uploaded product images (public read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
