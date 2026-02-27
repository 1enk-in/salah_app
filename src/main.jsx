import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css'
import './styles/global.css'
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext.jsx"
import "@fontsource/playfair-display/700.css";
import "@fontsource/inter/400.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);