# MAHBUB Sports Prediction App

This repository contains a simple sports prediction app for Android and iPhone using:

- Backend: Node.js + Express
- Mobile app: React Native + Expo
- Data model: in-memory demo data for easy startup

Important:
- This is a virtual points-based prediction app
- No real-money deposit or withdrawal is included
- It is designed as a starter MVP and can be extended with real database and auth

## Project structure

- `backend/` — Express API server
- `mobile/` — Expo React Native app

## Quick start

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Install mobile deps:
   ```bash
   cd mobile
   npm install
   npm start
   ```

3. Scan the QR code in Expo Go or run on emulator.

## Notes

- Android emulator should use `http://10.0.2.2:3000`
- Real device should use your machine IP, for example `http://192.168.1.10:3000`
- The backend includes demo fixtures for quick testing
