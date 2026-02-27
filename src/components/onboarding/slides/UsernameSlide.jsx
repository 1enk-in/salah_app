import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import Lottie from "lottie-react";
import usernameAnimation from "../../../assets/username.json";

export default function UsernameSlide({
  username,
  setUsername,
  onNext
}) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username.trim()) {
      setAvailable(false);
      setError("");
      return;
    }

    const delay = setTimeout(() => {
      checkUsername(username.trim().toLowerCase());
    }, 500);

    return () => clearTimeout(delay);
  }, [username]);

  async function checkUsername(value) {
  if (value.length < 3) {
    setError("Minimum 3 characters");
    setAvailable(false);
    return;
  }

  setChecking(true);
  setError("");

  try {
    const usernameRef = doc(db, "usernames", value);
    const snapshot = await getDoc(usernameRef);

    if (snapshot.exists()) {
      setAvailable(false);
      setError("Username already taken");
    } else {
      setAvailable(true);
      setError("");
    }
  } catch (err) {
    console.error(err);
    setAvailable(false);
  }

  setChecking(false);
}

  const isValid = available && !checking;

  return (
  <div className="purple-slide-page purple-slide">

    {/* 3D / Lottie Character Area */}
    <div className="illustration-area">
  <Lottie
    animationData={usernameAnimation}
    loop
    autoplay
    className="hero-lottie"
  />
</div>

    {/* Title Section */}
    <div className="text-block">
      <h2>Choose Your Username</h2>
      <p>This will be your unique identity</p>
    </div>

    {/* Glass Bottom Panel */}
    <div className="bottom-panel">

      <div className="username-input-wrapper dark">

        <span className="username-prefix">@</span>

        <input
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
            )
          }
          className={`username-input 
            ${isValid ? "valid" : ""}
            ${error ? "invalid" : ""}
          `}
          placeholder="navedsalah"
        />

        {checking && (
          <div className="input-status loading"></div>
        )}

        {!checking && isValid && (
          <div className="input-status success">✓</div>
        )}

        {!checking && error && (
          <div className="input-status error">✕</div>
        )}

      </div>

      {error && (
        <div className="username-error dark">
          {error}
        </div>
      )}

      <button
        className="primary-glass-btn"
        disabled={!isValid}
        onClick={onNext}
      >
        Continue
      </button>

    </div>
  </div>
);
}