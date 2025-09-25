# Firebase Setup Instructions

To complete the Firebase integration, follow these steps:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "productive-timer")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Set up Firestore Database

1. In your Firebase project console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database
5. Click "Done"

## 3. Get Firebase Configuration

1. In your Firebase project console, click the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "productive-timer-web")
5. Copy the Firebase configuration object

## 4. Update Firebase Configuration

Replace the placeholder values in `src/config/firebase.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Configure Firestore Security Rules (Optional)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timer_sessions/{document} {
      allow read, write: if true; // For development
      // For production, add proper authentication rules
    }
  }
}
```

## 6. Test the Integration

1. Start your development server
2. Create a timer session and save it
3. Check your Firestore console to see the data
4. Refresh the page to verify data persistence

Your Firebase integration is now complete!