alter table public.awards_payment_transactions drop constraint if exists awards_payment_transactions_type_check;
alter table public.awards_payment_transactions add constraint awards_payment_transactions_type_check check (type in ('vote','gift','registration_fee','donation_candidate','donation_platform','donation_pot','capital_angel'));
