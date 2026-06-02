# TypeScript/React Native/Node/SQLite3/Knex.js - Workout Log Mobile App #

## A work-in-progress mobile app for gym enthusiasts, where the users can track their progress in a big variety of exercises ## 

This app will have an UI where the user can:
 
* Start a new workout for the current day
* Pick a muscle group
* Pick an exercise
* Add sets, reps, load, RIR (reps in reserve) and notes
* Access past workouts
* Create new exercises

Technical features:

* This app stack consists in TypeScript, React Native, Node, Knex.js and SQLite3 as the local DB.
* At this moment, TanStack Query hasn't been introduced yet, but I'm planning to do so once the basic functionalities are in place (currently using fetch).

## Setup notes

1) Install all project dependencies from the root folder:

```bash
npm install
```

This repo uses npm workspaces, so running `npm install` from the root installs the dependencies for the mobile app, the API, and shared packages.

2) Set up the API database:

```bash
npm run knex -w apps/api -- migrate:latest
npm run knex -w apps/api -- seed:run
```

3) Start the API:

```bash
npm run dev:api
```

4) Start the mobile app:

```bash
npm run dev:mobile
```

5) Install Expo Go on your mobile<br>
Google Play: https://play.google.com/store/apps/details?id=host.exp.exponent&hl=en_NZ<br>
Apple Store: https://apps.apple.com/us/app/expo-go/id982107779

6) Open Expo Go and scan the QR Code generated on the terminal.

Obs: when testing on a phone, the phone and computer must be on the same Wi-Fi network.
