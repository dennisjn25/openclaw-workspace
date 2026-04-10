/*
  PluginEditor.cpp
  The BackRoom - AI Vocal Production Assistant
*/

#include "PluginEditor.h"

TheBackRoomAudioProcessorEditor::TheBackRoomAudioProcessorEditor(TheBackRoomAudioProcessor& p)
    : AudioProcessorEditor(&p), processor(p)
{
    setSize(1200, 700);
    
    // ===== LEFT PANEL: Analysis =====
    genreLabel.setText("Genre", juce::dontSendNotification);
    genreLabel.setFont(juce::Font(14, juce::Font::bold));
    addAndMakeVisible(genreLabel);
    
    genreSelector.addItem("Pop", 1);
    genreSelector.addItem("Hip-Hop", 2);
    genreSelector.addItem("Rock", 3);
    genreSelector.addItem("EDM", 4);
    genreSelector.addItem("Jazz", 5);
    genreSelector.setSelectedItemIndex(0);
    addAndMakeVisible(genreSelector);
    
    vocalIntentLabel.setText("Vocal Type", juce::dontSendNotification);
    vocalIntentLabel.setFont(juce::Font(14, juce::Font::bold));
    addAndMakeVisible(vocalIntentLabel);
    
    vocalIntentSelector.addItem("Lead Sung", 1);
    vocalIntentSelector.addItem("Lead Rap", 2);
    vocalIntentSelector.addItem("Background Harmony", 3);
    vocalIntentSelector.addItem("Ad-lib", 4);
    vocalIntentSelector.setSelectedItemIndex(0);
    addAndMakeVisible(vocalIntentSelector);
    
    analyzeButton.setButtonText("Analyze Mix");
    addAndMakeVisible(analyzeButton);
    
    analysisStatus.setText("Ready to analyze", juce::dontSendNotification);
    analysisStatus.setFont(juce::Font(12));
    addAndMakeVisible(analysisStatus);
    
    // ===== CENTER PANEL: Visualizer =====
    vocalDisplayLabel.setText("Vocal Intelligence Display", juce::dontSendNotification);
    vocalDisplayLabel.setFont(juce::Font(16, juce::Font::bold));
    addAndMakeVisible(vocalDisplayLabel);
    
    // ===== RIGHT PANEL: Processing =====
    matchLabel.setText("Reference Match", juce::dontSendNotification);
    matchLabel.setFont(juce::Font(14, juce::Font::bold));
    addAndMakeVisible(matchLabel);
    
    matchSlider.setRange(0.0, 1.0);
    matchSlider.setValue(0.5);
    matchSlider.setSliderStyle(juce::Slider::LinearHorizontal);
    addAndMakeVisible(matchSlider);
    
    ambianceLabel.setText("Ambiance", juce::dontSendNotification);
    ambianceLabel.setFont(juce::Font(14, juce::Font::bold));
    addAndMakeVisible(ambianceLabel);
    
    ambianceSlider.setRange(0.0, 1.0);
    ambianceSlider.setValue(0.5);
    ambianceSlider.setSliderStyle(juce::Slider::LinearHorizontal);
    addAndMakeVisible(ambianceSlider);
    
    harmonyLabel.setText("AI Harmony", juce::dontSendNotification);
    harmonyLabel.setFont(juce::Font(14, juce::Font::bold));
    addAndMakeVisible(harmonyLabel);
    
    harmonySlider.setRange(0.0, 1.0);
    harmonySlider.setValue(0.0);
    harmonySlider.setSliderStyle(juce::Slider::LinearHorizontal);
    addAndMakeVisible(harmonySlider);
    
    characterSelector.addItem("Original", 1);
    characterSelector.addItem("Jazz", 2);
    characterSelector.addItem("Rock", 3);
    characterSelector.addItem("80s Pop", 4);
    characterSelector.addItem("ASMR", 5);
    characterSelector.setSelectedItemIndex(0);
    addAndMakeVisible(characterSelector);
    
    // ===== BOTTOM PANEL: Actions =====
    referenceButton.setButtonText("Load Reference");
    addAndMakeVisible(referenceButton);
    
    exportButton.setButtonText("Export Vocal");
    addAndMakeVisible(exportButton);
    
    slotMachineButton.setButtonText("Slot Machine");
    addAndMakeVisible(slotMachineButton);
}

TheBackRoomAudioProcessorEditor::~TheBackRoomAudioProcessorEditor()
{
}

void TheBackRoomAudioProcessorEditor::paint(juce::Graphics& g)
{
    // Background
    g.fillAll(juce::Colours::darkgrey);
    
    // Draw panels
    g.setColour(juce::Colours::lightgrey.withAlpha(0.3f));
    
    // Left panel background
    g.fillRoundedRectangle(10, 10, 280, 680, 10);
    
    // Center panel background
    g.fillRoundedRectangle(300, 10, 400, 680, 10);
    
    // Right panel background
    g.fillRoundedRectangle(710, 10, 280, 680, 10);
    
    // Bottom action bar
    g.fillRoundedRectangle(10, 590, 980, 90, 10);
    
    // Header
    g.setColour(juce::Colours::white);
    g.setFont(juce::Font(24, juce::Font::bold));
    g.drawText("The BackRoom", 20, 20, 300, 40, juce::Justification::left);
    
    g.setFont(juce::Font(12));
    g.drawText("AI Vocal Production Assistant", 20, 55, 300, 20, juce::Justification::left);
}

void TheBackRoomAudioProcessorEditor::resized()
{
    auto area = getLocalBounds();
    
    // Left panel: 10-290
    genreLabel.setBounds(20, 80, 100, 20);
    genreSelector.setBounds(20, 105, 250, 30);
    
    vocalIntentLabel.setBounds(20, 150, 100, 20);
    vocalIntentSelector.setBounds(20, 175, 250, 30);
    
    analyzeButton.setBounds(20, 220, 250, 40);
    analysisStatus.setBounds(20, 270, 250, 20);
    
    // Right panel: 710-990
    matchLabel.setBounds(720, 80, 150, 20);
    matchSlider.setBounds(720, 105, 250, 30);
    
    ambianceLabel.setBounds(720, 150, 150, 20);
    ambianceSlider.setBounds(720, 175, 250, 30);
    
    harmonyLabel.setBounds(720, 220, 150, 20);
    harmonySlider.setBounds(720, 245, 250, 30);
    
    characterSelector.setBounds(720, 300, 250, 30);
    
    // Bottom: 10-100, 590-680
    referenceButton.setBounds(20, 600, 200, 40);
    exportButton.setBounds(230, 600, 200, 40);
    slotMachineButton.setBounds(440, 600, 200, 40);
}