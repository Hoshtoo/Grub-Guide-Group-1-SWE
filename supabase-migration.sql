-- GrubGuide Auth & Households Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Create profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create households table
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create household_members join table
CREATE TABLE IF NOT EXISTS household_members (
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (household_id, user_id)
);

-- 4. Add user_id column to inventory_items (nullable for backward compatibility)
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view household members profiles"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT hm2.user_id 
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        )
    );

-- 7. RLS Policies for households
CREATE POLICY "Users can view households they belong to"
    ON households FOR SELECT
    USING (
        id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create households"
    ON households FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Household creators can update their household"
    ON households FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Household creators can delete their household"
    ON households FOR DELETE
    USING (created_by = auth.uid());

-- 8. RLS Policies for household_members
CREATE POLICY "Users can view members of their households"
    ON household_members FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join households"
    ON household_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave households"
    ON household_members FOR DELETE
    USING (user_id = auth.uid());

-- 9. RLS Policies for inventory_items
CREATE POLICY "Users can view their own items"
    ON inventory_items FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view household members items"
    ON inventory_items FOR SELECT
    USING (
        user_id IN (
            SELECT hm2.user_id 
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own items"
    ON inventory_items FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own items"
    ON inventory_items FOR UPDATE
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update household members items"
    ON inventory_items FOR UPDATE
    USING (
        user_id IN (
            SELECT hm2.user_id 
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own items"
    ON inventory_items FOR DELETE
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete household members items"
    ON inventory_items FOR DELETE
    USING (
        user_id IN (
            SELECT hm2.user_id 
            FROM household_members hm1
            JOIN household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid()
        )
    );

-- 10. Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 12. Function to generate random invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
