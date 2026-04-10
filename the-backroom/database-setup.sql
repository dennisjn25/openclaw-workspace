-- The BackRoom - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores user profile data linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. PRESETS TABLE
-- User-created vocal chain presets for Style Share
CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('Pop', 'Hip-Hop', 'Rock', 'EDM', 'Jazz', 'Other')),
    preset_data JSONB NOT NULL DEFAULT '{}',
    downloads INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

-- Policies for presets
CREATE POLICY "Anyone can view public presets" 
    ON presets FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own presets" 
    ON presets FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert presets" 
    ON presets FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own presets" 
    ON presets FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own presets" 
    ON presets FOR DELETE USING (user_id = auth.uid());


-- 3. PRESET RATINGS TABLE
-- User ratings for presets
CREATE TABLE IF NOT EXISTS preset_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_id UUID REFERENCES presets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(preset_id, user_id)
);

ALTER TABLE preset_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" 
    ON preset_ratings FOR SELECT USING (true);

CREATE POLICY "Users can insert their own ratings" 
    ON preset_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
    ON preset_ratings FOR UPDATE USING (auth.uid() = user_id);


-- 4. CHALLENGES TABLE
-- Weekly community challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" 
    ON challenges FOR SELECT USING (active = true);


-- 5. CHALLENGE RESULTS TABLE
-- User challenge submissions
CREATE TABLE IF NOT EXISTS challenge_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    submission_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge results" 
    ON challenge_results FOR SELECT USING (true);

CREATE POLICY "Users can insert their own results" 
    ON challenge_results FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 6. USER SETTINGS TABLE
-- User preferences and plugin settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
    ON user_settings FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert their own settings" 
    ON user_settings FOR ALL USING (user_id = auth.uid());


-- 7. ARTIST SIGNATURE CHAINS (Curated presets)
CREATE TABLE IF NOT EXISTS artist_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_name TEXT NOT NULL,
    chain_name TEXT NOT NULL,
    preset_data JSONB NOT NULL,
    category TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE artist_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artist chains" 
    ON artist_chains FOR SELECT USING (true);


-- FUNCTIONS

-- Function to update preset rating on new rating insert
CREATE OR REPLACE FUNCTION update_preset_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE presets
    SET 
        average_rating = (
            SELECT AVG(rating)::NUMERIC(3,2)
            FROM preset_ratings
            WHERE preset_id = NEW.preset_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM preset_ratings
            WHERE preset_id = NEW.preset_id
        ),
        updated_at = NOW()
    WHERE id = NEW.preset_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
CREATE TRIGGER on_rating_insert
    AFTER INSERT ON preset_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_preset_rating();


-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE presets
    SET downloads = downloads + 1,
        updated_at = NOW()
    WHERE id = NEW.preset_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download tracking
CREATE TRIGGER on_preset_access
    AFTER SELECT ON presets
    FOR EACH ROW
    EXECUTE FUNCTION increment_downloads();


-- INDEXES
CREATE INDEX idx_presets_category ON presets(category);
CREATE INDEX idx_presets_user ON presets(user_id);
CREATE INDEX idx_presets_rating ON presets(average_rating DESC);
CREATE INDEX idx_challenge_results_challenge ON challenge_results(challenge_id);
CREATE INDEX idx_challenge_results_user ON challenge_results(user_id);


-- SEED DATA (Optional - for testing)
-- INSERT INTO challenges (title, description, difficulty, start_date, end_date)
-- VALUES 
--     ('Vocal Mix Challenge #1', 'Match the reference vocal in 90 seconds', 'Intermediate', NOW(), NOW() + INTERVAL '7 days'),
--     ('Quick Mix Sprint', 'Get a rap vocal mix-ready in 60 seconds', 'Beginner', NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days');