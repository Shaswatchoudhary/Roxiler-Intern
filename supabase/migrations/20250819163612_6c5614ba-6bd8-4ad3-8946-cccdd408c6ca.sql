-- create table profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'store_owner', 'user')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- create table stores
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  ratings_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- create table ratings with unique constraint per user per store by using unique index
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(user_id, store_id)
);

-- Enable RLS on all tables it means Row Level Security because it will allow to access data only for the user who is logged in
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- create function to get current user role by using auth.uid() because auth.uid() will return the id of the user who is logged in
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- create function to update store ratings by using trigger 
CREATE OR REPLACE FUNCTION public.update_store_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- calculate new average and count for the affected store by using trigger  the stores table are the one that will be updated
  UPDATE public.stores 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(score), 0)::DECIMAL(3,2) 
      FROM public.ratings 
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    ),
    ratings_count = (
      SELECT COUNT(*) 
      FROM public.ratings 
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id) --COALESCE is used to handle NULL values
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.store_id, OLD.store_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; --SECURITY DEFINER means that the function will be executed with the permissions of the user who is logged in  , $$ means end of the function and LANGUAGE plpgsql means that the function will be written in PL/pgSQL

-- Create trigger for automatic rating updates by using trigger update_store_rating_trigger
CREATE TRIGGER update_store_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- Create function to update timestamps by using trigger update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; --$$ means end of the function and LANGUAGE plpgsql means that the function will be written in PL/pgSQL

-- create triggers for updating timestamps by using trigger update_updated_at_column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- create trigger for updating timestamps by using trigger update_updated_at_column
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- create trigger for updating timestamps by using trigger update_updated_at_column
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles by using trigger update_updated_at_column which controls access to the profiles table and the column average_rating
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE  -- controls access to the profiles table and the column average_rating
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" -- mainly view the profiles table and the column average_rating
  ON public.profiles FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" -- mainly update the profiles table and the column average_rating
  ON public.profiles FOR UPDATE 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

-- RLS Policies for stores by using trigger update_updated_at_column which controls access to the stores table and the column average_rating
CREATE POLICY "Everyone can view stores" 
  ON public.stores FOR SELECT 
  USING (true);

CREATE POLICY "Store owners can insert their own stores" 
  ON public.stores FOR INSERT 
  WITH CHECK (
    auth.uid() = owner_id AND 
    public.get_current_user_role() IN ('store_owner', 'admin')
  );

CREATE POLICY "Store owners can update their own stores" 
  ON public.stores FOR UPDATE 
  USING (
    auth.uid() = owner_id OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins can delete stores" 
  ON public.stores FOR DELETE 
  USING (public.get_current_user_role() = 'admin');

-- RLS Policies for ratings by using trigger update_updated_at_column which controls access to the ratings table and the column average_rating
CREATE POLICY "Everyone can view ratings" 
  ON public.ratings FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own ratings" 
  ON public.ratings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
  ON public.ratings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
  ON public.ratings FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ratings" 
  ON public.ratings FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- create function to handle new user signup by using trigger update_updated_at_column which controls access to the ratings table and the column average_rating
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
END;-- end of the function
$$ LANGUAGE plpgsql SECURITY DEFINER; --SECURITY DEFINER means that the function will be executed with the permissions of the user who is logged in

-- trigger to create profile on user signup by using trigger update_updated_at_column which controls access to the ratings table and the column average_rating
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();