# InterestExplorer 🌌

InterestExplorer is an intelligent learning and curiosity companion built with React Native and Expo, powered by Supabase and the Groq (Llama 3.1) API. It helps users discover fascinating interconnections between their different fields of interest and sparks curious pathways of learning.

> [!NOTE]
> **Project Scope Notice:**
> This project is currently a **base app idea**. This idea will be massive and it will be available in the Google Play Store with many more exciting features that are not yet introduced! 🚀

---

## Features

- 🧠 **Curiosity Companion:** Seamless chat interface powered by state-of-the-art LLMs (Llama 3 via Groq API) to explore your favorite concepts.
- 💡 **Curiosity Memo Injection:** Dynamically connects two seemingly unrelated interests of yours and injects fascinating facts to broaden your perspective.
- 📖 **Spark Archive:** Collect and curate fascinating insights directly in your local Curiosity Journal (powered by Supabase).
- 🎨 **Rich Aesthetics:** Neon/Space-themed high-fidelity custom design with smooth visual feedback.
- 🔒 **Secure Configuration:** Zero hardcoded API keys. The app fully adopts Expo's environment variable system.

---

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo Go app on your iOS/Android device (or emulator)

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/draghureddy2748-crypto/InterestExplorerBaseIdea.git
   cd InterestExplorerBaseIdea
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

### Configuration

The app relies on Supabase and Groq APIs. To run the app successfully, you need to configure your environment variables and initialize your database:

1. Copy the `.env.example` template to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and replace the placeholder values with your actual API credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_GROQ_API_KEY=your-groq-key
   ```

> [!WARNING]
> Never commit your `.env` file to version control. It is already included in `.gitignore` to prevent exposure.

3. **Initialize the Supabase Database:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open the **SQL Editor** for your project.
   - Click **New Query** and paste the contents of [schema.sql](file:///c:/Users/dragh/InterestExplorerAntigravityGithub/schema.sql).
   - Run the query. This will create the required tables (`profiles`, `interests`, `user_interests`, `bookmarks`), configure Row Level Security (RLS) policies, and seed the default list of interests.

### Running the App

To launch the Metro bundler and start the development server:

```bash
npm run start
```

- Press `a` to open on an Android emulator/device.
- Press `i` to open on an iOS simulator/device.
- Scan the QR code on your phone using the **Expo Go** app to test live!
- Press `w` to open on a web browser.

### Vercel Deployment

This project is fully configured for hosting on **Vercel** as a single-page web application.

1. **Push your code to GitHub** (without committing your `.env` file).
2. **Import the repository** in your [Vercel Dashboard](https://vercel.com).
3. **Configure Environment Variables:** In your Vercel project settings under the **Environment Variables** tab, add the following variables:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_GROQ_API_KEY`
4. **Deploy:** Vercel will automatically read [vercel.json](file:///c:/Users/dragh/InterestExplorerAntigravityGithub/vercel.json) to execute `npm run build` and publish the exported web application from the `dist` directory.

---

## Technical Architecture

- **Frontend:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 56)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Orchestration:** [Groq Cloud API](https://groq.com/) (Llama-3.1-8b-instant)
- **Local Persistence:** AsyncStorage & Secure Store
- **Hosting / CI-CD:** [Vercel](https://vercel.com) & [Netlify](https://netlify.com)

