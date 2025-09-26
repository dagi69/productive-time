# Firebase Setup Instructions

To complete the Firebase integration for your Productive Timer app, follow these steps:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
)
2. Click "Create a project\" or "Add project"
3. Enter your project name (e.g., "productive-timer")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Set up Firestore Database

1. In your Firebase project console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode\" for development (you can change this later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## 3. Get Firebase Configuration

1. In your Firebase project console, click the gear icon (Project settings)
2. Scroll down to "Your apps\" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "productive-timer-web")
5. Copy the Firebase configuration object that appears

## 4. Update Firebase Configuration

Replace the placeholder values in `firebase-config.js\` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Configure Firestore Security Rules (Optional for Production)

For production, update your Firestore security rules in the Firebase console:

1. Go to Firestore Database > Rules
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timer_sessions/{document} {
      allow read, write: if true; // For development only
      // For production, add proper authentication rules
    }
  }
}
```

## 6. Test the Integration

1. Open your HTML file in a web browser
2. Create a timer session and save it
3. Check your Firestore console to see the data under the "timer_sessions\" collection
4. Refresh the page to verify data persistence

## 7. Deploy Your App (Optional)

You can deploy your app using Firebase Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize hosting: `firebase init hosting`
4. Deploy: `firebase deploy`

Your Firebase integration is now complete! The app will automatically sync data to the cloud and work across multiple devices.

## Troubleshooting

- **CORS Issues**: Make sure you're serving the HTML file from a web server, not opening it directly in the browser
- **Connection Issues**: Check your internet connection and Firebase project settings
- **Data Not Saving**: Verify your Firebase configuration and check the browser console for errors