import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeApp } from "firebase/app";

//Before loading the app initialise firebase with the config for our project (this is needed to use firebase authentication)
const firebaseConfig = {
  apiKey: "AIzaSyDsJ0DGup-UvPY6a67DHNFqbMq-5RlfSlk",
  authDomain: "whsreportingapp.firebaseapp.com",
  projectId: "whsreportingapp",
  storageBucket: "whsreportingapp.firebasestorage.app",
  messagingSenderId: "1078851674510",
  appId: "1:1078851674510:web:1b82b8ef8affde2f7884df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App /> {/* This is loading the App.jsx component page*/}
  </StrictMode>,
)
