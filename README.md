# aDUBator Dub Siren

A professional dub siren application with touch controls and motion detection. Built with React Native for cross-platform compatibility.

## Features
- Siren sound generation with adjustable pitch (400Hz)
- LFO (Low-Frequency Oscillator) modulation
- Echo/Delay effects
- Motion-based controls using device accelerometer
- Preset management with date-based saving
- Audio routing for external devices
- Modern, responsive UI with dark theme

## Getting Started
1. Install dependencies: `yarn install`
2. Run on iOS: `yarn ios`
3. Run on Android: `yarn android`

## Project Structure
```
src/
  ├── assets/           # Images, fonts, and audio files
  ├── components/       # Reusable UI components
  ├── constants/        # App-wide constants
  ├── context/          # React context providers
  ├── hooks/            # Custom React hooks
  ├── navigation/       # Navigation configuration
  ├── screens/          # Main app screens
  ├── services/         # Business logic and external services
  ├── store/            # State management
  ├── theme/            # Styling and theming
  └── types/            # TypeScript type definitions
```
