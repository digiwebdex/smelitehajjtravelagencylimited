-- Add is_child and child_age columns to air_ticket_passengers table
ALTER TABLE public.air_ticket_passengers 
ADD COLUMN is_child boolean DEFAULT false,
ADD COLUMN child_age integer NULL;