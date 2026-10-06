# 🌊 Flowgen

> Organize your content, not your files.

[![Deploy Status](https://img.shields.io/badge/Deploy-Render-success.svg?style=for-the-badge&logo=render&color=46E3B7)](https://flowgen-vcul.onrender.com)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

Flowgen is a modern, high-performance workspace designed to help you organize content seamlessly through an AI-powered interface. Built with an intense focus on dynamic design, smooth animations, and premium aesthetics, Flowgen provides a state-of-the-art environment for modern workflows.

## ✨ Features

- **Dynamic Workspace**: A beautiful, fluid interface built with React and Framer Motion.
- **AI Integration**: Powered by OpenAI to assist and generate content contextually.
- **Secure Authentication**: Robust authentication system supporting Email/Password and Google OAuth powered by Firebase.
- **Performance First**: Extremely fast loading and interaction times powered by Vite.
- **Modern Aesthetics**: Glassmorphism, deep dark modes, dynamic glowing text, and tailored gradients.

## 🚀 Live Demo

Check out the live application hosted on Render:
**[flowgen-vcul.onrender.com](https://flowgen-vcul.onrender.com)**

## 💻 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express.js
- **Database & Auth**: Firebase (Firestore, Authentication)
- **AI Services**: OpenAI API

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- Firebase Project
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/guruchiwate06/Flowgen.git
   cd Flowgen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory based on `.env.example` and fill in your keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the application**
   You can run the frontend development server and backend API concurrently (or in separate terminals):
   ```bash
   # Run Frontend (Vite)
   npm run dev
   
   # Run Backend (Express)
   node server/server.js
   ```

## 🌐 Deployment

Flowgen is optimized for deployment on platforms like Render, Vercel, or Netlify. 
- Ensure all `.env` variables are added to your hosting provider's dashboard.
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

## 📜 License

MIT License - feel free to modify and use this project for your own purposes!
