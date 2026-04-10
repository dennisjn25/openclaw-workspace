/*
  PluginProcessor.cpp
  The BackRoom - AI Vocal Production Assistant
*/

#include "PluginProcessor.h"
#include "PluginEditor.h"

TheBackRoomAudioProcessor::TheBackRoomAudioProcessor()
    : AudioProcessor(BusesProperties()
        .withInput("Input", juce::AudioChannelSet::stereo(), true)
        .withOutput("Output", juce::AudioChannelSet::stereo(), true))
{
    // Initialize audio engine
    audioEngine = std::make_unique<AudioEngine>();
    
    // Initialize AI processor
    aiProcessor = std::make_unique<AIProcessor>();
    
    // Initialize default parameters
    parameters.state = juce::ValueTree("TheBackRoom");
}

TheBackRoomAudioProcessor::~TheBackRoomAudioProcessor()
{
}

void TheBackRoomAudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    if (audioEngine) {
        audioEngine->prepare(sampleRate, samplesPerBlock);
    }
    if (aiProcessor) {
        aiProcessor->initialize();
    }
}

void TheBackRoomAudioProcessor::releaseResources()
{
    if (audioEngine) {
        audioEngine->release();
    }
}

void TheBackRoomAudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, 
                                              juce::MidiBuffer& midiMessages)
{
    // Process audio through AI analysis
    if (aiProcessor) {
        aiProcessor->process(buffer);
    }
    
    // Apply audio processing chain
    if (audioEngine) {
        audioEngine->process(buffer);
    }
}

juce::AudioProcessorEditor* TheBackRoomAudioProcessor::createEditor()
{
    return new TheBackRoomAudioProcessorEditor(*this);
}

bool TheBackRoomAudioProcessor::hasEditor() const
{
    return true;
}

const juce::String TheBackRoomAudioProcessor::getName() const
{
    return "The BackRoom";
}

bool TheBackRoomAudioProcessor::acceptsMidi() const
{
    return false;
}

bool TheBackRoomAudioProcessor::producesMidi() const
{
    return false;
}

double TheBackRoomAudioProcessor::getTailLengthSeconds() const
{
    return 2.0;
}

int TheBackRoomAudioProcessor::getNumPrograms()
{
    return 1;
}

int TheBackRoomAudioProcessor::getCurrentProgram()
{
    return 0;
}

void TheBackRoomAudioProcessor::setCurrentProgram(int index)
{
}

const juce::String TheBackRoomAudioProcessor::getProgramName(int index)
{
    return "Default";
}

void TheBackRoomAudioProcessor::changeProgramName(int index, const juce::String& newName)
{
}

void TheBackRoomAudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    // Save plugin state
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void TheBackRoomAudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    // Restore plugin state
    std::unique_ptr<juce::XmlElement> xml(getXmlFromBinary(data, sizeInBytes));
    if (xml && xml->hasTagName(parameters.state.getType())) {
        parameters.state = juce::ValueTree::fromXml(*xml);
    }
}

// Custom implementation methods
void TheBackRoomAudioProcessor::setGenre(int genreIndex)
{
    currentGenre = genreIndex;
    if (aiProcessor) {
        aiProcessor->setGenre(genreIndex);
    }
}

void TheBackRoomAudioProcessor::setVocalIntent(int intentIndex)
{
    currentVocalIntent = intentIndex;
    if (aiProcessor) {
        aiProcessor->setVocalIntent(intentIndex);
    }
}

void TheBackRoomAudioProcessor::analyzeReference(const juce::File& referenceFile)
{
    if (aiProcessor) {
        aiProcessor->loadReference(referenceFile);
    }
}

void TheBackRoomAudioProcessor::setMatchAmount(float amount)
{
    matchAmount = juce::jlimit(0.0f, 1.0f, amount);
    if (audioEngine) {
        audioEngine->setMatchAmount(matchAmount);
    }
}

void TheBackRoomAudioProcessor::setAmbianceAmount(float amount)
{
    ambianceAmount = juce::jlimit(0.0f, 1.0f, amount);
    if (audioEngine) {
        audioEngine->setAmbianceAmount(ambianceAmount);
    }
}

void TheBackRoomAudioProcessor::enableHarmonyGeneration(bool enable, int numVoices)
{
    if (aiProcessor) {
        aiProcessor->enableHarmony(enable, numVoices);
    }
}

void TheBackRoomAudioProcessor::setCharacterPreset(int presetIndex)
{
    currentCharacter = presetIndex;
    if (aiProcessor) {
        aiProcessor->setCharacter(presetIndex);
    }
}