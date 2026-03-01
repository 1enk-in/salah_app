import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import RamadanPage from "./pages/RamadanPage";
import Login from "./pages/Login";
import Onboarding from "./components/onboarding/Onboarding";
import AppLoader from "./components/AppLoader";

function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState("home");
  const [appLoaded, setAppLoaded] = useState(false);

  // 🔥 Global Loader (runs once)
  useEffect(() => {
    if (!loading && user) {
      setAppLoaded(false);
    }
  }, [loading, user]);

  if (loading) return null;
  if (!user) return <Login />;

  // 🔥 Loader appears only once
  if (!appLoaded) {
    return <AppLoader onComplete={() => setAppLoaded(true)} />;
  }

  return (
    <>
      {!user.hasOnboarded && (
        <Onboarding setScreen={setScreen} />
      )}

      {user.hasOnboarded && screen === "home" && (
        <Home setScreen={setScreen} />
      )}

      {screen === "ramadan" && (
        <RamadanPage setScreen={setScreen} />
      )}
    </>
  );
}

export default App;