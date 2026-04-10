# The BackRoom - AI Vocal Production Assistant
# CMakeLists.txt

cmake_minimum_required(VERSION 3.15)
project(TheBackRoom VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE paths (adjust as needed)
set(JUCE_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/Modules/JUCE" CACHE PATH "Path to JUCE")

# Find JUCE
if(NOT EXISTS ${JUCE_ROOT})
    message(WARNING "JUCE not found at ${JUCE_ROOT}. Using FetchContent.")
    include(FetchContent)
    FetchContent_Declare(
        juce
        GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
        GIT_TAG 7.0.0
    )
    FetchContent_MakeAvailable(juce)
    set(JUCE_ROOT ${juce_SOURCE_DIR})
endif()

#juce_add_plugin(TheBackRoom
#    PRODUCT_NAME "The BackRoom"
#    COMPANY_NAME "YourCompany"
#    VERSION "1.0.0"
#    DESCRIPTION "AI Vocal Production Assistant"
#    FORMATS VST3
#)

# Source files
set(PLUGIN_SOURCES
    Source/Plugin/PluginProcessor.cpp
    Source/Plugin/PluginEditor.cpp
    Source/Plugin/Plugin.h
    Source/AudioEngine/AudioEngine.h
    Source/AudioEngine/AudioEngine.cpp
    Source/AIProcessing/AIProcessor.h
    Source/AIProcessing/AIProcessor.cpp
    Source/UI/MainComponent.h
    Source/UI/MainComponent.cpp
    Source/CloudService/CloudService.h
    Source/CloudService/CloudService.cpp
)

add_executable(TheBackRoom ${PLUGIN_SOURCES})

target_include_directories(TheBackRoom PRIVATE
    ${JUCE_ROOT}/modules
    ${CMAKE_CURRENT_SOURCE_DIR}/Source
)

target_link_libraries(TheBackRoom PRIVATE
    juce::juce_audio_utils
    juce::juce_dsp
)

# Copy VST3 to output
#juce_set_vst3_plugin_path(TheBackRoom ${CMAKE_BINARY_DIR}/VST3)

set_target_properties(TheBackRoom PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/VST3
)

message(STATUS "The BackRoom build configured")
message(STATUS "JUCE Root: ${JUCE_ROOT}")