# Frontyard Cricket

A React Native mobile app for live cricket scoring and match tracking, built for the Frontyard Cricket Club. Admins can create and score matches in real time while spectators watch live scores from the same app.

## Features

- **Live scoring** — ball-by-ball scoring with extras (wides, no-balls, byes, leg byes), wickets with dismissal types, and undo support
- **Match types** — limited-overs and Test matches (with declarations and follow-on)
- **Real-time sync** — scores update live for all viewers via Firestore
- **Analytics** — current run rate, required run rate, win probability, and player stats
- **Admin panel** — protected behind a login; admins can create matches, select players, and score
- **Scorecard** — full batting and bowling scorecards, innings break summary, and final match summary

## Tech Stack

| Tool | Version |
|---|---|
| React Native / Expo | SDK 54 |
| Firebase Firestore | v12 |
| React Navigation | v7 |
| React | 19 |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (for development)
- A Firebase project with Firestore enabled

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Sathufit/frontyard-mobile.git
cd frontyard-mobile
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Open `src/firebase.js` and replace the placeholder values with your Firebase project credentials:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

You can find these values in the Firebase Console under **Project Settings → Your apps → SDK setup and configuration**.

> Firestore must be enabled in your Firebase project. No specific security rules are required for development, but lock them down before production.

### 4. Start the development server

```bash
npm start
```

This starts the Expo development server. Scan the QR code with **Expo Go** on your phone, or press:
- `i` to open in iOS Simulator
- `a` to open in Android Emulator

---

## Project Structure

```
src/
├── firebase.js           # Firebase initialisation
├── context/
│   └── AuthContext.js    # Admin auth state
├── navigation/
│   └── AppNavigator.js   # Stack & tab navigation
├── screens/
│   ├── LandingScreen.js      # Entry screen with live match count
│   ├── HomeScreen.js         # Live matches list (public)
│   ├── WatchMatchScreen.js   # Live scorecard & analytics (public)
│   ├── LoginScreen.js        # Admin login
│   ├── AdminHomeScreen.js    # Admin dashboard
│   ├── CreateMatchScreen.js  # Match setup (type, overs, teams)
│   ├── SelectPlayersScreen.js# Player selection
│   ├── ScoringScreen.js      # Ball-by-ball scoring
│   ├── InningsBreakScreen.js # Innings summary between innings
│   ├── MatchSummaryScreen.js # Final match result & scorecards
│   └── SettingsScreen.js     # App info
├── services/
│   └── matchService.js   # Firestore read/write helpers
└── utils/
    ├── constants.js      # Colours, player list, dismissal types
    └── scoringEngine.js  # Pure scoring logic (runs, wickets, overs)
scripts/
└── cleanupMatches.js     # Node script to delete stale live matches
```

---

## Admin Access

The admin panel is accessible from the **New Match** tab. Log in with the admin credentials configured in your `AuthContext`. Admins can:

1. Create a new match (set match name, type, overs limit, and teams)
2. Select players for each team
3. Score ball by ball in real time
4. Declare innings (Test), manage innings breaks, and end matches

---

## Utility Script

To delete stale matches that never finished (e.g. from testing), fill in your Firebase config in `scripts/cleanupMatches.js` and run:

```bash
node scripts/cleanupMatches.js
```

---

## Building for Production

Use Expo's build service (EAS Build):

```bash
npm install -g eas-cli
eas build --platform ios   # or android
```

See the [Expo EAS docs](https://docs.expo.dev/build/introduction/) for full setup.
