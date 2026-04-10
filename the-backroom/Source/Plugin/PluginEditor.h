/*
  PluginEditor.h
  The BackRoom - AI Vocal Production Assistant
*/

#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_basics/juce_gui_basics.h>

class TheBackRoomAudioProcessor;

class TheBackRoomAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    TheBackRoomAudioProcessorEditor(TheBackRoomAudioProcessor&);
    ~TheBackRoomAudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    TheBackRoomAudioProcessor& processor;
    
    // UI Components - Left Panel (Analysis)
    juce::Label genreLabel;
    juce::ComboBox genreSelector;
    juce::Label vocalIntentLabel;
    juce::ComboBox vocalIntentSelector;
    juce::Button analyzeButton;
    juce::Label analysisStatus;
    
    // UI Components - Center Panel (Vocal Display)
    juce::Label vocalDisplayLabel;
    // Visualizer component would go here
    
    // UI Components - Right Panel (Processing)
    juce::Label matchLabel;
    juce::Slider matchSlider;
    juce::Label ambianceLabel;
    juce::Slider ambianceSlider;
    juce::Label harmonyLabel;
    juce::Slider harmonySlider;
    juce::ComboBox characterSelector;
    
    // UI Components - Bottom Panel (Advanced)
    juce::Button referenceButton;
    juce::Button exportButton;
    juce::Button slotMachineButton;
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TheBackRoomAudioProcessorEditor)
};