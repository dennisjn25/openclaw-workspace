/*
  AudioEngine.h
  The BackRoom - Core DSP processing
*/

#pragma once

#include <juce_dsp/juce_dsp.h>
#include <memory>

class AudioEngine
{
public:
    AudioEngine();
    ~AudioEngine();
    
    void prepare(double sampleRate, int samplesPerBlock);
    void release();
    void process(juce::AudioBuffer<float>& buffer);
    
    // Parameter controls
    void setMatchAmount(float amount);
    void setAmbianceAmount(float amount);
    void setUnmaskingAmount(float amount);
    void setCompressionAmount(float amount);
    
private:
    double sampleRate = 44100.0;
    
    // Dynamic EQ for unmasking
    std::unique_ptr<juce::dsp::ProcessorChain<
        juce::dsp::IIR::Filter<float>,
        juce::dsp::IIR::Filter<float>,
        juce::dsp::IIR::Filter<float>,
        juce::dsp::IIR::Filter<float>
    >> dynamicEQ;
    
    // Multi-band compressor
    std::unique_ptr<juce::dsp::Compressor<float>> compressor;
    
    // Reverb for ambiance
    std::unique_ptr<juce::dsp::Reverb> reverb;
    juce::dsp::Reverb::Parameters reverbParams;
    
    // Internal processing state
    float matchAmount = 0.5f;
    float ambianceAmount = 0.5f;
    float unmaskingAmount = 0.3f;
    float compressionAmount = 0.5f;
    
    // Process vocal isolation (placeholder for stem separation)
    void processVocalIsolation(juce::AudioBuffer<float>& buffer);
    
    // Apply dynamic EQ based on mix context
    void applyDynamicEQ(juce::AudioBuffer<float>& buffer, const juce::AudioBuffer<float>& mixContext);
    
    // Apply adaptive compression
    void applyAdaptiveCompression(juce::AudioBuffer<float>& buffer);
    
    // Apply reverb
    void applyAmbiance(juce::AudioBuffer<float>& buffer);
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(AudioEngine)
};