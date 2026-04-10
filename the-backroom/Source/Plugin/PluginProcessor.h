/*
  PluginProcessor.h
  The BackRoom - AI Vocal Production Assistant
*/

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_dsp/juce_dsp.h>
#include "AudioEngine/AudioEngine.h"
#include "AIProcessing/AIProcessor.h"

class TheBackRoomAudioProcessor : public juce::AudioProcessor
{
public:
    TheBackRoomAudioProcessor();
    ~TheBackRoomAudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    void processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override;

    const juce::String getName() const override;
    bool acceptsMidi() const override;
    bool producesMidi() const override;
    double getTailLengthSeconds() const override;

    int getNumPrograms() override;
    int getCurrentProgram() override;
    void setCurrentProgram(int index) override;
    const juce::String getProgramName(int index) override;
    void changeProgramName(int index, const juce::String& newName) override;

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // Custom methods for The BackRoom features
    void setGenre(int genreIndex);
    void setVocalIntent(int intentIndex);
    void analyzeReference(const juce::File& referenceFile);
    void setMatchAmount(float amount); // 0.0 - 1.0
    void setAmbianceAmount(float amount);
    void enableHarmonyGeneration(bool enable, int numVoices);
    void setCharacterPreset(int presetIndex);

private:
    std::unique_ptr<AudioEngine> audioEngine;
    std::unique_ptr<AIProcessor> aiProcessor;
    
    // Plugin parameters
    float matchAmount = 0.5f;
    float ambianceAmount = 0.5f;
    int currentGenre = 0;
    int currentVocalIntent = 0;
    int currentCharacter = 0;
    
    juce::AudioProcessorValueTreeState parameters;
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TheBackRoomAudioProcessor)
};