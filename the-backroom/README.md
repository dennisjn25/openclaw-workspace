# The BackRoom - AI Vocal Production Assistant

A VST3 master bus plugin for AI-powered vocal production.

## Quick Start

### Prerequisites
- C++17 compiler
- CMake 3.15+
- JUCE 7.0+
- ONNX Runtime
- Python 3.9+ (for cloud services)

### Build
```bash
# Clone and setup
git clone https://github.com/yourorg/the-backroom.git
cd the-backroom

# Build
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
```

### Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `database-setup.sql` in the Supabase SQL Editor
3. Get your project URL and anon key from Settings > API
4. Configure in the plugin or companion app

### Install
Copy `TheBackRoom.vst3` to your DAW's plugin directory:
- macOS: `~/Library/Audio/Plug-Ins/VST3/`
- Windows: `C:\Program Files\Common Files\VST3\`

## Project Structure

```
the-backroom/
├── CMakeLists.txt           # Main build config
├── Source/
│   ├── Plugin/              # Main plugin entry
│   ├── AudioEngine/         # DSP processing
│   ├── AIProcessing/        # ONNX inference
│   ├── UI/                  # JUCE UI components
│   └── CloudService/        # Firebase/API client
├── Modules/                 # JUCE modules
├── Builds/                  # Platform-specific builds
├── Scripts/                 # Build and deployment scripts
├── Tests/                   # Unit and integration tests
├── Docs/                   # Technical documentation
└── Resources/              # Icons, fonts, assets
```

## Development

### Code Style
- Use JUCE coding standards
- Maximum line length: 120
- Use RAII for audio resources
- Thread-safe audio processing

### Testing
```bash
# Run tests
cd build
ctest --output-on-failure
```

### Contributing
1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## Architecture

```
Input (Master Bus)
    │
    ▼
┌─────────────────────┐
│   Stem Separator    │ ← ONNX model
│   (Vocal Isolation) │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌───────┐   ┌───────┐
│Analysis│   │Process│
│ Engine │   │ Chain │
└───────┘   └───────┘
    │           │
    ▼           ▼
┌─────────────────────┐
│  Context-Aware      │
│  Processing         │
│  (EQ, Comp, Reverb) │
└─────────┬───────────┘
          │
          ▼
     Output (Vocals)
```

## License

Proprietary - All rights reserved