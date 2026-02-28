import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import prayerAnimation from "../../../assets/prayer.json";

export default function PrayerSlide({
  username,
  photoURL,
  city,
  timezone,
  prayerTimes,
  onFinish
}) {
  const { user, setUser } = useAuth();

  async function handleFinish() {
  const userRef = doc(db, "users", user.uid);

  try {
    await runTransaction(db, async (transaction) => {

      // 🔹 Only handle username if it exists
      if (username && username.trim() !== "") {
        const usernameRef = doc(db, "usernames", username.trim());
        const usernameSnap = await transaction.get(usernameRef);

        if (usernameSnap.exists()) {
          const existingUid = usernameSnap.data().uid;

          if (existingUid !== user.uid) {
            throw new Error("Username already taken");
          }
        }

        transaction.set(usernameRef, {
          uid: user.uid
        });
      }

      // 🔹 Always save user data
      const finalUsername =
  username?.trim() ||
  user.email?.split("@")[0];

transaction.set(userRef, {
  username: finalUsername,
  photoURL,
  city,
  timezone,
  prayerTimes,
  hasOnboarded: true,
  hasSeenWelcome: false
}, { merge: true });
    });

    setUser(prev => ({
      ...prev,
      username: username || null,
      hasOnboarded: true
    }));

    document.body.classList.add("blur-transition");

setTimeout(() => {
  onFinish();
  document.body.classList.remove("blur-transition");
}, 500);

  } catch (err) {
    console.error(err);
  }
}

  function getActivePrayer() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const [name, time] of Object.entries(prayerTimes || {})) {
      if (!time) continue;

      const [clock, modifier] = time.split(" ");
      let [h, m] = clock.split(":").map(Number);

      if (modifier === "PM" && h !== 12) h += 12;
      if (modifier === "AM" && h === 12) h = 0;

      const prayerMinutes = h * 60 + m;

      if (currentMinutes <= prayerMinutes) {
        return name;
      }
    }

    return "isha";
  }

  const activePrayer = getActivePrayer();

  return (
    <div className="odin-onboard-page odin-onboard-bg">

      <div className="odin-header">

  <h2 className="prayer-title-main">
    Today’s Prayer Times
  </h2>

  <p className="prayer-subtitle">
    Calculated automatically for your location
  </p>

</div>

      <div className="odin-illustration">
        <Lottie
          animationData={prayerAnimation}
          loop
          autoplay
          className="hero-lottie-prayer"
        />
      </div>

      <div className="region-badge">
    <span className="region-dot" />
    {city}
  </div>

      <div className="odin-panel">

        <div className="odin-prayer-list">

          {Object.entries(prayerTimes || {}).map(([name, time]) => (
            <div
              key={name}
              className={`odin-prayer-row ${
                activePrayer === name ? "active-prayer" : ""
              }`}
            >
              <div className="odin-prayer-left">
                <PrayerIcon name={name} />
                <span className="odin-prayer-name">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
              </div>

              <span className="odin-prayer-time">
                {time}
              </span>
            </div>
          ))}

        </div>

        <motion.button
          className="odin-finish-btn"
          onClick={handleFinish}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Finish
        </motion.button>

      </div>
    </div>
  );
}

/* ================= SVG ICONS ================= */

function PrayerIcon({ name }) {
  const base = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (name) {
    case "fajr": // sunrise
      return (
        <svg {...base}>
          <path d="M3 15h18" />
          <path d="M12 5v4" />
          <path d="M5 10l2 2" />
          <path d="M19 10l-2 2" />
          <path d="M4 15a8 8 0 0116 0" />
        </svg>
      );

    case "dhuhr":
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.5 4.5l2 2" />
      <path d="M17.5 17.5l2 2" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.5 19.5l2-2" />
      <path d="M17.5 6.5l2-2" />
    </svg>
  );
    case "asr": // sun lower
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="4" />
          <path d="M3 17h18" />
        </svg>
      );

    case "maghrib":
  return (
    <svg {...base}>
      <path d="M3 17h18" />
      <path d="M4 17a8 8 0 0116 0" />
      <line x1="6" y1="20" x2="18" y2="20" />
    </svg>
  );

    case "isha": // moon
      return (
        <svg {...base}>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );

    default:
      return null;
  }
}