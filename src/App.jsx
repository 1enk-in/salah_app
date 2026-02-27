import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import RamadanPage from "./pages/RamadanPage";
import Login from "./pages/Login";
import Onboarding from "./components/onboarding/Onboarding";

function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState("home");

if (loading) return null;
if (!user) return <Login />;

  

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