-- Create profiles table for user data with roles
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

-- Create stores table
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

-- Create ratings table with unique constraint per user per store
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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to update store ratings
CREATE OR REPLACE FUNCTION public.update_store_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate new average and count for the affected store
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
      WHERE store_id = COALESCE(NEW.store_id, OLD.store_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.store_id, OLD.store_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic rating updates
CREATE TRIGGER update_store_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_store_rating();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

-- RLS Policies for stores
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

-- RLS Policies for ratings
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

-- Create function to handle new user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();