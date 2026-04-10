/*
  CloudService.h
  The BackRoom - Supabase cloud integration
*/

#pragma once

#include <juce_core/juce_core.h>

namespace TheBackRoom {

class SupabaseClient
{
public:
    SupabaseClient();
    ~SupabaseClient();
    
    // Configuration
    void setConfig(const juce::String& url, const juce::String& anonKey);
    bool isConfigured() const;
    
    // Authentication
    void signIn(const juce::String& email, const juce::String& password);
    void signUp(const juce::String& email, const juce::String& password);
    void signOut();
    bool isAuthenticated() const;
    juce::String getUserId() const;
    
    // Preset Management
    void uploadPreset(const juce::String& name, const juce::String& description,
                     const juce::String& category, const juce::String& presetData);
    void downloadPreset(const juce::String& presetId);
    void getPresets(const juce::String& category = "");
    void searchPresets(const juce::String& query);
    void ratePreset(const juce::String& presetId, int rating);
    void deletePreset(const juce::String& presetId);
    
    // User Data
    void saveUserSettings(const juce::String& userId, const juce::String& settingsJson);
    void loadUserSettings(const juce::String& userId);
    
    // Community Challenges
    void getWeeklyChallenges();
    void submitChallengeResult(const juce::String& challengeId, int score);
    void getLeaderboard(const juce::String& challengeId);
    
    // Real-time subscriptions
    void subscribeToPresetUpdates(std::function<void(const juce::String&)> callback);
    void unsubscribe();

private:
    juce::String supabaseUrl;
    juce::String supabaseAnonKey;
    juce::String authToken;
    juce::String userId;
    bool authenticated = false;
    
    juce::StringArray extractJsonArray(const juce::String& json, const juce::String& key);
    juce::String makeRequest(const juce::String& method, const juce::String& endpoint,
                            const juce::String& body = "");
};

// Database schema for Supabase
namespace Schema {
    
    // Table: profiles
    // Stores user profile data
    // - id: uuid (FK to auth.users)
    // - username: text
    // - avatar_url: text
    // - created_at: timestamp
    
    // Table: presets
    // User-created vocal chain presets
    // - id: uuid
    // - user_id: uuid (FK to profiles.id)
    // - name: text
    // - description: text
    // - category: text (e.g., "Pop", "Rock", "Hip-Hop")
    // - preset_data: jsonb
    // - downloads: integer
    // - average_rating: float
    // - created_at: timestamp
    // - updated_at: timestamp
    
    // Table: preset_ratings
    // User ratings for presets
    // - id: uuid
    // - preset_id: uuid (FK to presets.id)
    // - user_id: uuid (FK to profiles.id)
    // - rating: integer (1-5)
    // - created_at: timestamp
    
    // Table: challenges
    // Weekly community challenges
    // - id: uuid
    // - title: text
    // - description: text
    // - start_date: timestamp
    // - end_date: timestamp
    // - active: boolean
    
    // Table: challenge_results
    // User challenge submissions
    // - id: uuid
    // - challenge_id: uuid (FK to challenges.id)
    // - user_id: uuid (FK to profiles.id)
    // - score: integer
    // - created_at: timestamp
    
    // Table: user_settings
    // User preferences and settings
    // - id: uuid
    // - user_id: uuid (FK to profiles.id)
    // - settings: jsonb
    // - updated_at: timestamp

} // namespace Schema

} // namespace TheBackRoom