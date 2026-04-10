/*
  CloudService.cpp
  The BackRoom - Supabase cloud integration
*/

#include "CloudService.h"

namespace TheBackRoom {

SupabaseClient::SupabaseClient()
{
}

SupabaseClient::~SupabaseClient()
{
    unsubscribe();
}

void SupabaseClient::setConfig(const juce::String& url, const juce::String& anonKey)
{
    supabaseUrl = url;
    supabaseAnonKey = anonKey;
    
    DBG("TheBackRoom: Supabase configured - " << url);
}

bool SupabaseClient::isConfigured() const
{
    return supabaseUrl.isNotEmpty() && supabaseAnonKey.isNotEmpty();
}

void SupabaseClient::signIn(const juce::String& email, const juce::String& password)
{
    if (!isConfigured()) {
        DBG("TheBackRoom: Supabase not configured");
        return;
    }
    
    // Build request body
    juce::String body = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    
    juce::String response = makeRequest("POST", "/auth/v1/token?grant_type=password", body);
    
    // Parse response for JWT token
    // In real implementation, extract token from JSON response
    authenticated = true;
    userId = "user-placeholder"; // Extract from response
    
    DBG("TheBackRoom: Signed in as " << email);
}

void SupabaseClient::signUp(const juce::String& email, const juce::String& password)
{
    if (!isConfigured()) {
        DBG("TheBackRoom: Supabase not configured");
        return;
    }
    
    juce::String body = "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    
    juce::String response = makeRequest("POST", "/auth/v1/signup", body);
    
    // Handle email confirmation
    DBG("TheBackRoom: Sign up request sent for " << email);
}

void SupabaseClient::signOut()
{
    if (!authenticated) return;
    
    makeRequest("POST", "/auth/v1/logout", "");
    authenticated = false;
    authToken.clear();
    userId.clear();
    
    DBG("TheBackRoom: Signed out");
}

bool SupabaseClient::isAuthenticated() const
{
    return authenticated;
}

juce::String SupabaseClient::getUserId() const
{
    return userId;
}

void SupabaseClient::uploadPreset(const juce::String& name, const juce::String& description,
                                   const juce::String& category, const juce::String& presetData)
{
    if (!authenticated) {
        DBG("TheBackRoom: Must be authenticated to upload presets");
        return;
    }
    
    juce::String body = "{"
        "\"name\":\"" + name + "\","
        "\"description\":\"" + description + "\","
        "\"category\":\"" + category + "\","
        "\"preset_data\":" + presetData + ","
        "\"user_id\":\"" + userId + "\""
    "}";
    
    makeRequest("POST", "/rest/v1/presets", body);
    
    DBG("TheBackRoom: Uploaded preset - " << name);
}

void SupabaseClient::downloadPreset(const juce::String& presetId)
{
    makeRequest("GET", "/rest/v1/presets?id=eq." + presetId, "");
    
    DBG("TheBackRoom: Downloading preset - " << presetId);
}

void SupabaseClient::getPresets(const juce::String& category)
{
    juce::String endpoint = "/rest/v1/presets?order=downloads.desc&limit=50";
    
    if (category.isNotEmpty()) {
        endpoint = "/rest/v1/presets?category=eq." + category + "&order=downloads.desc&limit=50";
    }
    
    makeRequest("GET", endpoint, "");
    
    DBG("TheBackRoom: Fetching presets" << (category.isNotEmpty() ? " for " + category : ""));
}

void SupabaseClient::searchPresets(const juce::String& query)
{
    juce::String endpoint = "/rest/v1/presets?or=(name.ilike." + query + ",description.ilike." + query + ")";
    
    makeRequest("GET", endpoint, "");
    
    DBG("TheBackRoom: Searching presets for - " << query);
}

void SupabaseClient::ratePreset(const juce::String& presetId, int rating)
{
    if (!authenticated) return;
    
    juce::String body = "{"
        "\"preset_id\":\"" + presetId + "\","
        "\"user_id\":\"" + userId + "\","
        "\"rating\":" + juce::String(rating) + ""
    "}";
    
    makeRequest("POST", "/rest/v1/preset_ratings", body);
    
    DBG("TheBackRoom: Rated preset " << presetId << " as " << rating);
}

void SupabaseClient::deletePreset(const juce::String& presetId)
{
    if (!authenticated) return;
    
    makeRequest("DELETE", "/rest/v1/presets?id=eq." + presetId, "");
    
    DBG("TheBackRoom: Deleted preset - " << presetId);
}

void SupabaseClient::saveUserSettings(const juce::String& userId, const juce::String& settingsJson)
{
    if (!authenticated) return;
    
    // Check if settings exist
    juce::String checkEndpoint = "/rest/v1/user_settings?user_id=eq." + userId;
    
    // Upsert (update or insert)
    juce::String body = "{"
        "\"user_id\":\"" + userId + "\","
        "\"settings\":" + settingsJson + ""
    "}";
    
    makeRequest("POST", "/rest/v1/user_settings", body);
    
    DBG("TheBackRoom: Saved user settings");
}

void SupabaseClient::loadUserSettings(const juce::String& userId)
{
    makeRequest("GET", "/rest/v1/user_settings?user_id=eq." + userId, "");
    
    DBG("TheBackRoom: Loading user settings for " << userId);
}

void SupabaseClient::getWeeklyChallenges()
{
    makeRequest("GET", "/rest/v1/challenges?active=eq.true&order=end_date.asc", "");
    
    DBG("TheBackRoom: Fetching weekly challenges");
}

void SupabaseClient::submitChallengeResult(const juce::String& challengeId, int score)
{
    if (!authenticated) return;
    
    juce::String body = "{"
        "\"challenge_id\":\"" + challengeId + "\","
        "\"user_id\":\"" + userId + "\","
        "\"score\":" + juce::String(score) + ""
    "}";
    
    makeRequest("POST", "/rest/v1/challenge_results", body);
    
    DBG("TheBackRoom: Submitted challenge score - " << score);
}

void SupabaseClient::getLeaderboard(const juce::String& challengeId)
{
    makeRequest("GET", "/rest/v1/challenge_results?challenge_id=eq." + 
                 challengeId + "&order=score.desc&limit=100", "");
    
    DBG("TheBackRoom: Fetching leaderboard for " << challengeId);
}

void SupabaseClient::subscribeToPresetUpdates(std::function<void(const juce::String&)> callback)
{
    // Real-time subscriptions would use Supabase Realtime
    // This is a placeholder for the callback mechanism
    DBG("TheBackRoom: Subscribed to preset updates");
}

void SupabaseClient::unsubscribe()
{
    DBG("TheBackRoom: Unsubscribed from updates");
}

juce::String SupabaseClient::makeRequest(const juce::String& method, 
                                         const juce::String& endpoint,
                                         const juce::String& body)
{
    // In a real implementation, this would use JUCE's HTTP client
    // to make the actual REST API call to Supabase
    
    // Example implementation:
    // juce::URL url(supabaseUrl + endpoint);
    // url = url.withHeader("apikey", supabaseAnonKey);
    // if (authenticated) url = url.withHeader("Authorization", "Bearer " + authToken);
    // url = url.withHeader("Content-Type", "application/json");
    
    // auto response = method == "GET" ? url.get() : url.post(body);
    
    DBG("TheBackRoom: " << method << " " << endpoint);
    
    return "{}"; // Placeholder response
}

} // namespace TheBackRoom