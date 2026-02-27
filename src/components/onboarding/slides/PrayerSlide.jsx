import { doc, updateDoc, setDoc, runTransaction } from "firebase/firestore";
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
  setPrayerTimes,
  onFinish
}) {
  const { user, setUser } = useAuth();

  function convertTo24(time12h) {
    if (!time12h) return "";

    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (modifier === "PM" && hours !== "12") {
      hours = String(parseInt(hours) + 12);
    }
    if (modifier === "AM" && hours === "12") {
      hours = "00";
    }

    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  function convertTo12(time24h) {
    let [hours, minutes] = time24h.split(":");
    hours = parseInt(hours);

    let modifier = "AM";

    if (hours >= 12) {
      modifier = "PM";
      if (hours > 12) hours -= 12;
    }

    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${modifier}`;
  }

  function handleChange(name, value) {
    setPrayerTimes({
      ...prayerTimes,
      [name]: convertTo12(value)
    });
  }

  async function handleFinish() {
  const usernameRef = doc(db, "usernames", username);
  const userRef = doc(db, "users", user.uid);

  try {
    await runTransaction(db, async (transaction) => {

      const usernameSnap = await transaction.get(usernameRef);

      if (usernameSnap.exists()) {
        const existingUid = usernameSnap.data().uid;

        // If username belongs to another user → block
        if (existingUid !== user.uid) {
          throw new Error("Username already taken");
        }
      }

      // Safe to set
      transaction.set(usernameRef, {
        uid: user.uid
      });

      transaction.set(userRef, {
        username,
        photoURL,
        city,
        timezone,
        prayerTimes,
        hasOnboarded: true
      }, { merge: true });

    });
    setUser(prev => ({
  ...prev,
  username,
  hasOnboarded: true
}));

onFinish();

    onFinish(); // Now this WILL run

  } catch (err) {
    console.error(err);
  }
}

function getPrayerIcon(name) {
  switch (name) {
    case "fajr":
      return "🌅";
    case "dhuhr":
      return "☀️";
    case "asr":
      return "🌤";
    case "maghrib":
      return "🌇";
    case "isha":
      return "🌙";
    default:
      return "🕌";
  }
}

  return (
  <div className="odin-slide-page odin-slide">

    {/* LOTTIE HEADER */}
    <div className="text-block-odin">
      <p className="location-display">
    📍 {city}
  </p>
  <h2>Prayer Times Ready</h2>
  
</div>
<div className="illustration-area-prayer">
  <Lottie
    animationData={prayerAnimation}
    loop
    autoplay
    className="hero-lottie-prayer"
  />
</div>



    {/* PRAYER LIST */}
    <div className="bottom-panel-odin">

      <div className="prayer-list">

        {Object.entries(prayerTimes || {}).map(([name, time]) => (
          <div key={name} className="prayer-card-odin">

            <div className="prayer-name">
  <span className="prayer-icon">
    {getPrayerIcon(name)}
  </span>

  {name.charAt(0).toUpperCase() + name.slice(1)}
</div>

            <input
              type="time"
              value={convertTo24(time)}
              onChange={(e) =>
                setPrayerTimes({
                  ...prayerTimes,
                  [name]: convertTo12(e.target.value)
                })
              }
              className="time-input-odin"
            />

          </div>
        ))}

      </div>

      <motion.button
  className="primary-odin-btn"
  onClick={handleFinish}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  Finish Setup
</motion.button>

    </div>

  </div>
);
}