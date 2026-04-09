# Mood Journal App - Product Plan

## Working Name
Mood Journal

## Product Thesis
This app should help people notice patterns in how they feel, express what is happening beneath the surface, and build a personal record they actually want to return to.

The first version should feel calm, fast, private, and emotionally intelligent.

This product is now specifically aimed at people dealing with **BPD, bipolar disorder, and ADHD**. That means the app should support emotional regulation, low-friction logging, pattern visibility, and safety without pretending to diagnose or replace treatment.

## Recommendation
Build the MVP as a **mobile-first Expo React Native app** with **TypeScript** and a **local-first data model**.

Why this is the right first move:
- journaling and mood tracking are mobile-native behaviors
- local-first keeps privacy strong and reduces backend drag
- Expo gives fast iteration and clean path to iOS and Android
- we can add cloud sync later without rebuilding the whole app

## Core User Promise
In under 60 seconds, I can log how I feel, write what is on my mind, and start seeing patterns over time.

Secondary promise: the app helps me slow down, externalize my state, and notice escalation or instability earlier.

## MVP Scope

### 1. Daily Check-In
- choose mood from a simple scale or mood cards
- optional energy level
- optional stress level
- short note or full journal entry
- tags like work, relationships, sleep, health, creativity
- optional impulse intensity
- optional sleep quality and hours
- optional medication taken toggle

### 2. Journal Timeline
- chronological list of entries
- quick scan of date, mood, and preview text
- tap into full entry detail

### 3. Insights
- weekly mood trend
- common tags
- streaks or consistency stats
- simple correlations like low sleep tag + low mood
- pattern visibility for sleep, energy, impulsivity, and emotional volatility

### 4. Privacy and Safety
- local storage by default
- optional app lock later
- export entries later
- clear statement that the app is supportive, not diagnostic
- crisis support and emergency resources surfaced in high-risk moments
- no manipulative streak pressure or shaming language

### 5. Condition-Specific Support

#### ADHD
- fast check-ins with minimal typing
- reminders that are gentle, not guilt-inducing
- visual simplification and clear next action
- break thoughts into quick bullets, voice notes later

#### Bipolar Disorder
- mood plus energy plus sleep tracking together
- highlight unusual shifts across multiple days, not single noisy entries
- avoid overconfident AI interpretations of mania or depression

#### BPD
- strong emotional labeling support
- distress tolerance and grounding shortcuts
- relationship trigger and abandonment trigger tags
- optional DBT-style coping prompts

## V1 Screens
1. Onboarding
2. Home / Today check-in
3. New entry
4. Timeline
5. Entry detail
6. Insights
7. Settings

## Data Model

### Entry
- id
- createdAt
- updatedAt
- moodScore (1-5)
- moodLabel
- energyScore (1-5, optional)
- stressScore (1-5, optional)
- note
- tags[]

### Future Tables
- prompts
- habits
- reminders
- userPreferences
- syncState

## UX Principles
- one-tap logging first, depth second
- soft visual language, low friction
- no clutter pretending to be wellness
- insights should feel useful, not preachy
- emotionally safe language at every layer
- avoid features that intensify obsession, panic, or self-judgment
- never frame the app as a clinician or crisis responder

## Technical Stack
- Expo
- React Native
- TypeScript
- Expo Router
- Zustand for lightweight state if needed
- expo-sqlite for local persistence
- react-native-svg or chart library for insights visuals

## Safety and Compliance Notes
- Treat mental health data as highly sensitive.
- Minimize collection and retention.
- Use explicit consent for any future sync, analytics, or AI features.
- Keep privacy explanations plain and visible.
- Add 988 and emergency escalation options in obvious places.
- Get clinician review before marketing clinical claims.

These notes are informed by NIMH condition overviews and FTC guidance for health apps.

## Build Sequence

### Milestone 1 - App Shell
- scaffold Expo app
- set up routing
- set up base theme
- create screen placeholders

### Milestone 2 - Entry Flow
- build mood selector
- build journal form
- save entries locally
- show entries in timeline

### Milestone 3 - Insights
- build trend cards
- weekly summary
- tag frequency

### Milestone 4 - Polish
- onboarding
- settings
- export path
- app icon and brand system

## Nice Future Features
- AI reflection summaries
- guided prompts
- voice journaling
- photo attachment
- reminders
- cloud sync
- therapist-friendly export
- DBT skill cards
- early warning pattern summaries
- collaborative share mode for therapist or trusted person

## Product Decisions Made Today
- mobile-first
- local-first
- mood + journal hybrid, not just mood taps
- Expo React Native stack

## Open Questions
- Should the brand feel clinical, cozy, premium, or spiritual?
- Do you want anonymous local-only use first, or account-based sync early?
- Should mood input be numeric, emoji-based, or named states?
- Do you want the first release aimed at diagnosed users, self-identified users, or both?
