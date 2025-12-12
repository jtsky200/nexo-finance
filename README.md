# Nexo - Personal Finance & Tax Assistant

A comprehensive personal finance and tax management application built with React, Firebase, and TypeScript.

## 🚀 Features

- **Finance Tracking**: Track income and expenses with categories, payment methods, and status
- **Invoice Management**: Create and manage invoices for people with automatic expense creation
- **Reminders**: Set up reminders for payments, appointments, and tasks
- **Shopping List**: Manage shopping items with categories
- **Multi-language Support**: German and English interface
- **Real-time Sync**: Firebase Firestore for real-time data synchronization

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend**: Firebase Cloud Functions, Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Firebase Hosting
- **UI Components**: shadcn/ui, Radix UI

## 📦 Project Structure

```
nexo/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and hooks
│   │   └── contexts/    # React contexts
├── functions/           # Firebase Cloud Functions
│   └── src/
│       └── index.ts    # Cloud Functions definitions
├── drizzle/            # Database schema (not used, using Firestore)
└── firebase.json       # Firebase configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- pnpm
- Firebase CLI
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jtsky200/nexo-finance.git
cd nexo-finance
```

2. Install dependencies:
```bash
pnpm install
cd functions && pnpm install && cd ..
```

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Download service account key and save as `nexo-jtsky100-firebase-adminsdk-fbsvc-*.json`

4. Configure Firebase:
```bash
# Update firebase.json with your project ID
# Update client/src/lib/firebase.ts with your Firebase config
```

### Development

1. Start the development server:
```bash
pnpm dev
```

2. Deploy Cloud Functions:
```bash
cd functions
pnpm deploy
```

3. Deploy to Firebase Hosting:
```bash
pnpm build
firebase deploy --only hosting
```

## 📝 Environment Variables

The following environment variables are automatically injected by Firebase:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## 🔒 Security

- Never commit Firebase service account keys to the repository
- Use `.gitignore` to exclude sensitive files
- Firebase credentials are stored in `nexo-jtsky100-firebase-adminsdk-fbsvc-*.json` (excluded from git)

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.

## 📧 Contact

For questions or support, please contact the project owner.

## 🌐 Live Demo

Visit the live application at: https://nexo-jtsky100.web.app

## 📊 Current Status

✅ Finance tracking with income/expense management
✅ Invoice management with person tracking
✅ Status dropdown functionality
✅ Multi-language support (DE/EN)
✅ Real-time data synchronization
⚠️ Date display shows "N/A" (in progress)
🔄 Ongoing improvements and bug fixes

