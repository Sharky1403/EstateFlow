-- Migration 012: Unit access codes for contractor work orders
alter table units add column if not exists access_code text;
