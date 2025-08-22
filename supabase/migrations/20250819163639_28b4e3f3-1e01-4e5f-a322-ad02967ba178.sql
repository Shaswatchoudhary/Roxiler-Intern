-- fix security warnings by setting search_path for functions 
-- set search_path = public means that the function will be executed with the permissions of the user who is logged in
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_store_rating() -- create function to update store ratings by using trigger 
RETURNS TRIGGER AS $$ -- $$ means end of the function
BEGIN -- begin of the function
  -- calculate new average and count for the affected store
  UPDATE public.stores 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(score), 0)::DECIMAL(3,2) 
      FROM public.ratings 
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    ),
    ratings_count = (
      SELECT COUNT(*) -- count the number of ratings for the affected store affected means the store that is being updated
      FROM public.ratings 
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.store_id, OLD.store_id);
  
  RETURN COALESCE(NEW, OLD); --COALESCE is used to handle NULL values
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;--SECURITY DEFINER means that the function will be executed with the permissions of the user who is logged in