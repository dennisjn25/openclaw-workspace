/*
  AIProcessor.h
  The BackRoom - ONNX-based AI processing
*/

#pragma once

#include <juce_core/juce_core.h>
#include <memory>
#include <vector>

class AIProcessor
{
public:
    AIProcessor();
    ~AIProcessor();
    
    void initialize();
    
    // Genre and vocal detection
    void setGenre(int genreIndex);
    void setVocalIntent(int intentIndex);
    int getDetectedGenre() const;
    int getDetectedVocalIntent() const;
    
    // Reference analysis
    void loadReference(const juce::File& audioFile);
    void analyzeReference();
    float getMatchScore() const;
    
    // Harmony generation
    void enableHarmony(bool enable, int numVoices);
    void processHarmony(const juce::AudioBuffer<float>& input, 
                       juce::AudioBuffer<float>& output);
    
    // Character vocalists
    void setCharacter(int characterIndex);
    
    // Processing
    void process(juce::AudioBuffer<float>& buffer);
    
private:
    bool initialized = false;
    
    // Detection state
    int currentGenre = 0;
    int currentVocalIntent = 0;
    int detectedGenre = 0;
    int detectedVocalIntent = 0;
    
    // Reference analysis
    bool referenceLoaded = false;
    float matchScore = 0.0f;
    std::vector<float> referenceProfile;
    
    // Harmony settings
    bool harmonyEnabled = false;
    int harmonyVoiceCount = 2;
    
    // Character preset
    int currentCharacter = 0;
    
    // ONNX model placeholders (real implementation would use ONNX Runtime)
    std::unique_ptr<class StemSeparator> stemSeparator;
    std::unique_ptr<class GenreClassifier> genreClassifier;
    std::unique_ptr<class HarmonyGenerator> harmonyGenerator;
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(AIProcessor)
};

// Placeholder classes for ONNX models
class StemSeparator {
public:
    virtual ~StemSeparator() = default;
    virtual std::vector<float> process(const float* audio, int numSamples) = 0;
};

class GenreClassifier {
public:
    virtual ~GenreClassifier() = default;
    virtual int classify(const float* audioFeatures, int numFeatures) = 0;
};

class HarmonyGenerator {
public:
    virtual ~HarmonyGenerator() = default;
    virtual void generate(const float* melody, int numNotes, 
                         float* output, int numVoices) = 0;
    virtual void setStyle(const juce::String& style) = 0;
};