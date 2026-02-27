import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/home.css";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import fireAnimation from "../assets/fire.json"; // you'll add this
import { useTheme } from "../context/ThemeContext.jsx"
import { themes } from "../theme/themes";

function SingleOffsetModal({
  prayer,
  onClose,
  offsets,
  setOffsets,
  user,
  prayerTimes,
  parseTimeToMinutes,
  prayerGradient
}) {
  const key = prayer.toLowerCase();
  const baseTime = offsets[key] ?? 0;

  const [value, setValue] = useState(baseTime);
  const [multiplier, setMultiplier] = useState(1);

  const multipliers = [1, 2, 5, 10];
  const holdRef = useRef(null);
const speedRef = useRef(220);

  function changeOffset(direction) {
  haptic("light");

  setValue(prev => {
    const next = prev + direction * multiplier;
    return Math.max(-60, Math.min(60, next));
  });
}

function startHold(direction) {
  haptic("medium");

  speedRef.current = 220;

  holdRef.current = setInterval(() => {
    setValue(prev => {
      const next = prev + direction * multiplier;
      return Math.max(-60, Math.min(60, next));
    });

    // acceleration
    if (speedRef.current > 60) {
      speedRef.current -= 20;
      clearInterval(holdRef.current);
      holdRef.current = setInterval(() => {
        setValue(prev => {
          const next = prev + direction * multiplier;
          return Math.max(-60, Math.min(60, next));
        });
      }, speedRef.current);
    }
  }, speedRef.current);
}

function stopHold() {
  clearInterval(holdRef.current);
}

useEffect(() => {
  return () => clearInterval(holdRef.current);
}, []);

  function reset() {
    setValue(0);
  }

  async function save() {
    const updated = { ...offsets, [key]: value };
    setOffsets(updated);

    await updateDoc(
      doc(db, "users", user.uid),
      { offsets: updated }
    );

    onClose();
  }

  function getPreviewTime() {
  if (!prayerTimes || !prayerTimes[key]) return "--:--";

  const baseMinutes = parseTimeToMinutes(prayerTimes[key]);
  if (baseMinutes == null) return "--:--";

  const newMinutes = baseMinutes + value;

  const safeMinutes =
    (newMinutes % 1440 + 1440) % 1440;

  const hours24 = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  const modifier = hours24 >= 12 ? "PM" : "AM";
  const hours12 =
    hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${modifier}`;
}

  return (
    <div
  className="tap-offset-card"
  style={{
    background: prayerGradient,
    backgroundSize: "200% 200%"
  }}
>
  <div className="tap-offset-inner">
      <div className="tap-header">
        <h2>{prayer} Offset Setting</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="tap-time-preview">
        {getPreviewTime()}
      </div>

      <div className="tap-adjust-row">
        <button
  className="tap-btn minus"
  onMouseDown={() => startHold(-1)}
  onMouseUp={stopHold}
  onMouseLeave={stopHold}
  onTouchStart={() => startHold(-1)}
  onTouchEnd={stopHold}
  onClick={() => changeOffset(-1)}
>
  -{multiplier} min
</button>

        <div className="tap-offset-value">
          {value > 0 ? `+${value}` : value} min
        </div>

        <button
  className="tap-btn plus"
  onMouseDown={() => startHold(1)}
  onMouseUp={stopHold}
  onMouseLeave={stopHold}
  onTouchStart={() => startHold(1)}
  onTouchEnd={stopHold}
  onClick={() => changeOffset(1)}
>
  +{multiplier} min
</button>
      </div>

      <div className="tap-multipliers">
        {multipliers.map(m => (
          <button
            key={m}
            className={`multi-btn ${
              multiplier === m ? "active" : ""
            }`}
            onClick={() => setMultiplier(m)}
          >
            x{m}
          </button>
        ))}
      </div>

      <div className="tap-actions">
        <button className="reset-btn" onClick={reset}>
          Reset
        </button>

        <button className="save-btn" onClick={save}>
          Save
        </button>
      </div>
      </div>
    </div>
  );
}

function haptic(type = "light") {
  if (navigator.vibrate) {
    if (type === "light") navigator.vibrate(10);
    if (type === "medium") navigator.vibrate(20);
    if (type === "heavy") navigator.vibrate(35);
  }
}

function Home({ setScreen }) {
  const { user, loading, logout  } = useAuth();

  const [nextPrayer, setNextPrayer] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [todayTimes, setTodayTimes] = useState([]);
const [showProfileSheet, setShowProfileSheet] = useState(false);
const [profileImage, setProfileImage] = useState(null);
const [headerExpanded, setHeaderExpanded] = useState(false);
const uiActive = headerExpanded || showProfileSheet;
const [activeNav, setActiveNav] = useState("home");
const [profileView, setProfileView] = useState("main");
const { theme, currentTheme, setCurrentTheme } = useTheme();
const [themeTransitioning, setThemeTransitioning] = useState(false);
const [rippleOrigin, setRippleOrigin] = useState({ x: 0, y: 0 });
const [displayTime, setDisplayTime] = useState(nextPrayer?.time);
const [manualPrayer, setManualPrayer] = useState(null);
const [now, setNow] = useState(new Date());
const [activeOffsetPrayer, setActiveOffsetPrayer] = useState(null);

  if (loading) {
  return <div style={{ color: "white" }}>Checking auth...</div>;
}

if (!user) {
  return <div style={{ color: "white" }}>Not logged in</div>;
}

const [offsets, setOffsets] = useState({
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0
});

useEffect(() => {
  setDisplayTime(nextPrayer?.time);
}, [nextPrayer]);

useEffect(() => {
  function handleGlobalClick(e) {
  const clickedInsideTimeline = e.target.closest(".prayer-timeline");
  const clickedInsideOffset = e.target.closest(".tap-offset-card");

  if (!clickedInsideTimeline && !clickedInsideOffset && manualPrayer) {
    setManualPrayer(null);
  }
}

  document.addEventListener("click", handleGlobalClick);
  return () => document.removeEventListener("click", handleGlobalClick);
}, [manualPrayer]);

useEffect(() => {
  if (headerExpanded || showProfileSheet) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}, [headerExpanded, showProfileSheet]);

useEffect(() => {
  if (!headerExpanded && !showProfileSheet) {
    setActiveNav("home");
  }
}, [headerExpanded, showProfileSheet]);

async function handleThemeChange(key) {
  if (key === currentTheme) return;

  setThemeTransitioning(true);

  setTimeout(async () => {
    setCurrentTheme(key);

    if (user?.uid) {
      await updateDoc(doc(db, "users", user.uid), {
        theme: key
      });
    }

    setThemeTransitioning(false);
  }, 450);
}

  // 🔥 Load Prayer Times From Firestore
  useEffect(() => {
    if (!user) return;

    async function loadPrayerTimes() {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists() && snap.data().prayerTimes) {
  const raw = snap.data().prayerTimes;
  if (snap.data().offsets) {
  setOffsets(snap.data().offsets);
}
  if (snap.exists() && snap.data().theme) {
  setCurrentTheme(snap.data().theme);
}

  const normalized = {
    fajr: raw.fajr || raw.Fajr || "5:00 AM",
    dhuhr: raw.dhuhr || raw.Dhuhr || "1:00 PM",
    asr: raw.asr || raw.Asr || "5:00 PM",
    maghrib: raw.maghrib || raw.Maghrib || "6:30 PM",
    isha: raw.isha || raw.Isha || "8:00 PM",
    taraweeh: raw.taraweeh || raw.Taraweeh || null
  };

  setPrayerTimes(normalized);
} else {
  const defaults = {
    fajr: "5:41 AM",
    dhuhr: "1:30 PM",
    asr: "5:25 PM",
    maghrib: "6:43 PM",
    isha: "8:30 PM",
    taraweeh: "8:45 PM"
  };

  await setDoc(
    doc(db, "users", user.uid),
    { prayerTimes: defaults },
    { merge: true }
  );

  setPrayerTimes(defaults);
}
    }

    loadPrayerTimes();
  }, [user]);

  function parseTimeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return null;

  if (!timeString.includes(" ")) {
    const [h, m] = timeString.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  const [time, modifier] = timeString.split(" ");
  if (!time || !modifier) return null;

  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

  useEffect(() => {
  const interval = setInterval(() => {
    setNow(new Date());
  }, 1000); // every second

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
  if (!prayerTimes) return;

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60;

  const prayers = [
  { name: "Fajr", time: applyOffset(prayerTimes?.fajr, "Fajr") },
  { name: "Dhuhr", time: applyOffset(prayerTimes?.dhuhr, "Dhuhr") },
  { name: "Asr", time: applyOffset(prayerTimes?.asr, "Asr") },
  { name: "Maghrib", time: applyOffset(prayerTimes?.maghrib, "Maghrib") },
  { name: "Isha", time: applyOffset(prayerTimes?.isha, "Isha") }
].filter(p => p.time);

  setTodayTimes(prayers);

  let upcoming = null;

  for (let p of prayers) {
    const prayerMinutes = parseTimeToMinutes(p.time);
    if (prayerMinutes > currentMinutes) {
      upcoming = p;
      break;
    }
  }

  if (!upcoming && prayers.length > 0) {
    upcoming = prayers[0];
  }

  setNextPrayer(upcoming);

}, [prayerTimes, now, offsets]);

  if (!prayerTimes) {
  return <div style={{ color: "white" }}>Loading...</div>;
}

function exitManualMode() {
  setManualPrayer(null);
}

function getRemainingTime(timeString) {
  const prayerMinutes = parseTimeToMinutes(timeString);
  if (!prayerMinutes) return "";

  const prayerDate = new Date(now);

  prayerDate.setHours(
    Math.floor(prayerMinutes / 60),
    prayerMinutes % 60,
    0,
    0
  );

  if (prayerDate <= now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diffMs = prayerDate - now;

  if (diffMs <= 0) return "Starting...";

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.ceil(diffMs / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  // Under 1 minute → show seconds
  if (diffMs < 60000) {
    return `in 0m ${seconds}s`;
  }

  return `in ${hours}h ${minutes}m`;
}

function getPrayerSky(prayer) {
  switch (prayer) {

    case "Fajr":
      return `
        linear-gradient(
          135deg,
          #243B55 0%,
          #3A7CA5 40%,
          #5DA9E9 100%
        )
      `;

    case "Dhuhr":
      return `
        linear-gradient(
          135deg,
          #2C5364 0%,
          #3F87A6 50%,
          #6FB1FC 100%
        )
      `;

    case "Asr":
  return `
    linear-gradient(
      135deg,
      #2C3E50 0%,
      #4CA1AF 45%,
      #DCE35B 100%
    )
  `;

    case "Maghrib":
  return `
    linear-gradient(
      180deg,
      #1B2631 0%,
      #2E4053 25%,
      #C44536 55%,
      #E67E22 80%,
      #F5B041 100%
    )
  `;

    case "Isha":
      return `
        linear-gradient(
          135deg,
          #0f2027 0%,
          #203a43 50%,
          #2c5364 100%
        )
      `;

    default:
      return theme.headerGradient;
  }
}

function getMinutesRemaining(timeString) {
  const prayerMinutes = parseTimeToMinutes(timeString);
  if (!prayerMinutes) return 0;

  const prayerDate = new Date(now);

  prayerDate.setHours(
    Math.floor(prayerMinutes / 60),
    prayerMinutes % 60,
    0,
    0
  );

  if (prayerDate <= now) return 0;

  const diffMs = prayerDate - now;

  return diffMs / 60000; // exact float minutes
}

function getRemainingMs(timeString) {
  const prayerMinutes = parseTimeToMinutes(timeString);
  if (!prayerMinutes) return 0;

  const prayerDate = new Date(now);

  prayerDate.setHours(
    Math.floor(prayerMinutes / 60),
    prayerMinutes % 60,
    0,
    0
  );

  if (prayerDate <= now) {
    return 0;
  }

  return prayerDate - now;
}



function getPrayerProgress() {
  if (!todayTimes.length || !nextPrayer) return 0;

  const now = new Date();
  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const currentIndex = todayTimes.findIndex(
    p => p.name === nextPrayer.name
  );

  const prevIndex =
    currentIndex === 0
      ? todayTimes.length - 1
      : currentIndex - 1;

  const prevPrayerMinutes = parseTimeToMinutes(
    todayTimes[prevIndex].time
  );
  const nextPrayerMinutes = parseTimeToMinutes(
    nextPrayer.time
  );

  let total = nextPrayerMinutes - prevPrayerMinutes;
  if (total < 0) total += 1440;

  let passed = currentMinutes - prevPrayerMinutes;
  if (passed < 0) passed += 1440;

  return Math.min((passed / total) * 100, 100);
}

function applyOffset(timeString, prayerName) {
  const baseMinutes = parseTimeToMinutes(timeString);
  if (baseMinutes == null) return timeString;

  const offset = offsets[prayerName.toLowerCase()] || 0;

  const newMinutes = baseMinutes + offset;

  const hours24 = Math.floor((newMinutes % 1440 + 1440) % 1440 / 60);
  const minutes = (newMinutes % 60 + 60) % 60;

  const modifier = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${modifier}`;
}

const quickFeatures = [
  {
    id: "tracker",
    title: "Creator",
    subtitle: "Track Everything",
    image: "src/assets/tracker.png"
  },
  {
    id: "qibla",
    title: "Qibla",
    subtitle: "Find direction",
    image: "src/assets/qibla.png"
  },
  {
    id: "tasbih",
    title: "Tasbih",
    subtitle: "Digital dhikr counter",
    image: "src/assets/tasbih.png"
  },
  {
    id: "calendar",
    title: "Calendar",
    subtitle: "Islamic dates",
    image: "src/assets/calendar.png",
    action: () => setScreen("ramadan")
  },
  {
    id: "mosque",
    title: "Nearby Mosque",
    subtitle: "Find masjid",
    image: "src/assets/mosque.png"
  }
];

/// 🔥 DEV MODE OVERRIDE
const devPrayer = "Dhuhr"; // change to "Isha", "Maghrib", "Fajr"

const activePrayerName =
  manualPrayer || nextPrayer?.name;

// ✅ ADD THIS RIGHT HERE
const activePrayer =
  todayTimes.find(p => p.name === activePrayerName) || nextPrayer;
  return (
    <motion.div
  className={`home theme-${currentTheme}`}
  style={{ background: theme.background }}
  animate={{ opacity: 1 }}
  initial={{ opacity: 0.95 }}
  transition={{ duration: 0.4 }}
>

       {/* HEADER */}
    {/* HEADER */}
<motion.div
  layout
  drag="y"
  dragDirectionLock
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.y < -80) {
      setHeaderExpanded(false);
    }
  }}
  className={`header ${headerExpanded ? "expanded fixed" : ""}`}
  style={{ background: theme.headerGradient }}
  transition={{
  type: "spring",
  stiffness: 260,
  damping: 16
}}
>

  <div className="header-top-row">

    <div
      className="avatar"
      onClick={() => {
  if (showProfileSheet) {
    setShowProfileSheet(false);
  }
  setHeaderExpanded(prev => !prev);
}}
    />

    <div className="name">
      {user.email?.split("@")[0]}
    </div>

    <div className="bell" onClick={logout}>
      🚪
    </div>

  </div>

  {headerExpanded && (
    <motion.div
      className="header-expanded-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="header-card">
        <h2>User Stats here</h2>
      </div>
    </motion.div>
  )}

</motion.div>

{headerExpanded && (
  <motion.div
    className="header-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setHeaderExpanded(false)}
  />
)}

    {/* CONTENT WRAPPER */}
    <motion.div
  className="home-content"
  animate={{
    scale: uiActive ? 0.96 : 1,
    y: headerExpanded ? -20 : 0
  }}
  transition={{
    type: "spring",
    stiffness: 200,
    damping: 22
  }}
>

      {/* RAMADAN CARD */}
        <motion.div
  className="prayer-status-card"
  animate={{
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
  }}
  transition={{
    duration: 20,
    repeat: Infinity,
    ease: "linear"
  }}
  style={{
    background: getPrayerSky(activePrayerName),
    backgroundSize: "200% 200%"
  }}
  onClick={() => {
    if (manualPrayer) exitManualMode();
  }}
>

  

  {["Isha", "Fajr"].includes(activePrayerName) && (
    <div className="night-stars">
      {Array.from({ length: 20 }).map((_, i) => (
  <span
    key={i}
    style={{
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`
    }}
  />
))}
    </div>
  )}

<div className="sky-ambient">
  <div className={`orb ${activePrayerName}`} />
</div>

  {/* TOP ROW */}
  <div className="prayer-top">
    <div className="prayer-location">
      📍 Mumbai
    </div>

    <div className="prayer-date">
      {new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      })}
    </div>
  </div>

  {/* MAIN ROW */}
  {nextPrayer && (
    <div className="prayer-main-row">
      <div className="prayer-left">
        <div className="prayer-name-large">
          {activePrayer?.name}
        </div>

        {(() => {
  const offsetVal =
    offsets[activePrayer?.name?.toLowerCase()] || 0;

  const hasOffset = offsetVal !== 0;

  return (
    <div
      className={`offset-badge ${
        hasOffset ? "active" : ""
      }`}
      onClick={(e) => {
  e.stopPropagation();
  setActiveOffsetPrayer(activePrayer?.name);
}}
    >
      {hasOffset
        ? `${offsetVal > 0 ? "+" : ""}${offsetVal} min applied`
        : "Offset inactive"}
    </div>
  );
})()}

        <AnimatePresence mode="wait">
  <motion.div
    key={applyOffset(activePrayer?.time, activePrayer?.name)}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.25 }}
    className="prayer-time-large"
  >
    {activePrayer?.time}
  </motion.div>
</AnimatePresence>

       {(() => {
  const remainingMs = getRemainingMs(activePrayer?.time);
  const shouldPulse =
    remainingMs > 0 && remainingMs <= 5 * 60 * 1000;

  return (
    <motion.div
      className="prayer-countdown"
      animate={
        shouldPulse
          ? {
              scale: [1, 1.06, 1],
              backgroundColor: [
                "rgba(255,255,255,0.15)",
                "rgba(255, 90, 90, 0.66)",
                "rgba(255,255,255,0.15)"
              ],
              borderColor: [
                "rgba(255,255,255,0.18)",
                "rgba(255,120,120,0.6)",
                "rgba(255,255,255,0.18)"
              ]
            }
          : {
              scale: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.18)"
            }
      }
      transition={{
        duration: 1.4,
        repeat: shouldPulse ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      {getRemainingTime(activePrayer?.time)}
    </motion.div>
  );
})()}
      </div>

      <div className="prayer-icon">
  <AnimatePresence mode="wait">
    <motion.div
      key={activePrayerName}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="scene-wrapper"
    >
      {activePrayerName === "Fajr" && (
        <div className="fajr-scene">
          <img src="src/assets/fajr/moon.png" className="fajr-moon" />
          <img src="src/assets/fajr/cloud1.png" className="fajr-cloud fajr-cloud1" />
          <img src="src/assets/fajr/cloud2.png" className="fajr-cloud fajr-cloud2" />
          <img src="src/assets/fajr/small-cloud.png" className="fajr-small-cloud" />
          <img src="src/assets/fajr/star1.png" className="fajr-star fajr-star1" />
          <img src="src/assets/fajr/star2.png" className="fajr-star fajr-star2" />
          <img src="src/assets/fajr/star3.png" className="fajr-star fajr-star3" />
        </div>
      )}

      {activePrayerName === "Dhuhr" && (
        <div className="dhuhr-scene">
          <img src="src/assets/dhuhr/sun.png" className="dhuhr-sun" />
          <img src="src/assets/dhuhr/cloud.png" className="dhuhr-cloud main-cloud" />
          <img src="src/assets/dhuhr/cloud-small.png" className="dhuhr-small small" />
        </div>
      )}

      {activePrayerName === "Asr" && (
        <div className="asr-scene">
          <img src="src/assets/asr/sun.png" className="asr-sun" />
          <img src="src/assets/asr/cloud1.png" className="asr-cloud asr-cloud1" />
          <img src="src/assets/asr/cloud2.png" className="asr-cloud asr-cloud2" />
        </div>
      )}

      {activePrayerName === "Maghrib" && (
        <div className="maghrib-scene">
          <img src="src/assets/maghrib/sun.png" className="maghrib-sun" />
          <img src="src/assets/maghrib/cloud1.png" className="maghrib-cloud maghrib-cloud1" />
          <img src="src/assets/maghrib/cloud2.png" className="maghrib-cloud maghrib-cloud2" />
        </div>
      )}

      {activePrayerName === "Isha" && (
        <div className="isha-scene">
          <img src="src/assets/isha/moon.png" className="isha-moon" />
          <img src="src/assets/isha/cloud1.png" className="isha-cloud isha-cloud1" />
          <img src="src/assets/isha/cloud2.png" className="isha-cloud isha-cloud2" />
          <img src="src/assets/isha/star1.png" className="isha-star isha-star1" />
          <img src="src/assets/isha/star2.png" className="isha-star isha-star2" />
          <img src="src/assets/isha/star3.png" className="isha-star isha-star3" />
        </div>
      )}
    </motion.div>
  </AnimatePresence>
</div>
    </div>
  )}

  {/* PRAYER TIMELINE */}
  <div className="prayer-progress">
  <div className="progress-track">
    <motion.div
      className="progress-fill"
      animate={{ width: `${getPrayerProgress()}%` }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
  </div>
</div>
  <div
  className="prayer-timeline"
  style={
    activePrayerName === "Maghrib"
      ? { background: "rgba(40,20,10,0.35)" }
      : { background: "rgba(0,0,0,0.28)" }
  }
>
    {todayTimes.map((p) => (
  <div
    key={p.name}
    className="timeline-item"
    onClick={(e) => {
      e.stopPropagation();
      setManualPrayer(p.name);
    }}
  >
    {activePrayerName === p.name && (
      <motion.div
        layoutId="timelineHighlight"
        className="timeline-highlight"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      />
    )}
        <div className="timeline-name">{p.name}</div>
        <div className="timeline-time">
  {p.time}
</div>
      </div>
    ))}
  </div>

      </motion.div>


          {/* GRID */}

      <div className="quick-grid">
  {quickFeatures.map((item, i) => (
    <motion.div
      key={item.id}
      className="quick-card"
      style={{ background: theme.cardBackground }}
      onClick={item.action}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: i * 0.06,
        duration: 0.35,
        ease: "easeOut"
      }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="quick-card-inner">
        <img
          src={item.image}
          alt={item.title}
          className="quick-card-img"
        />

        <div className="quick-card-title">
          {item.title}
        </div>

        <div className="quick-card-sub">
          {item.subtitle}
        </div>
      </div>
    </motion.div>
  ))}
</div>

      

</motion.div>

<motion.div
  layout
  className={`bottom-nav ${showProfileSheet ? "expanded" : ""}`}
  style={{ background: theme.navBackground }}
  transition={{ type: "spring", stiffness: 260, damping: 20 }}
>
  {!showProfileSheet ? (
    <div className="nav-items-wrapper">

      {["home", "fire", "profile"].map((item) => (
        <div
          key={item}
          className="nav-item"
          onClick={() => {
            setActiveNav(item);

            if (item === "home") {
  setHeaderExpanded(false);
  setShowProfileSheet(false);
  setProfileView("main");
}

            if (item === "fire") {
  setShowProfileSheet(false);
  setProfileView("main");
  setHeaderExpanded(prev => !prev);
}

            if (item === "profile") {
  setHeaderExpanded(false);
  setShowProfileSheet(true);
  setProfileView("main");
}
          }}
        >
          {activeNav === item && (
            <motion.div
  layoutId="navHighlight"
  className="nav-highlight"
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 20
  }}
/>
          )}

          {item === "home" && "Home"}
          {item === "fire" && (
            <Lottie
              animationData={fireAnimation}
              loop
              style={{ width: 28 }}
            />
          )}
          {item === "profile" && "Profile"}

        </div>
      ))}

    </div>
  ) : (
    <motion.div 
    className="profile-content"
    style={{ background: theme.profileBackground }}>

  <div className="profile-fixed-header">
    <div
      className="profile-close"
      onClick={() => {
        setShowProfileSheet(false);
        setProfileView("main");
        setActiveNav("home");
      }}
    >
      Close
    </div>
  </div>

  <div className="profile-scroll">
        
      {profileView === "main" && (
  <>

    <h1 className="profile-title">Profile</h1>
    <div className="profile-divider" />

    <div className="profile-section-title">Account</div>

    <div
      className="profile-btn"
      onClick={() => setProfileView("manage")}
    >
      Manage Profile
    </div>

    <div
      className="profile-btn"
      onClick={() => setProfileView("security")}
    >
      Password & Security
    </div>

    <div className="profile-btn logout">
      Logout
    </div>

    <div className="profile-section-title">Preferences</div>

    <div
  className="profile-btn with-arrow"
  onClick={() => setProfileView("themes")}
>
  Themes
</div>
    <div className="profile-btn">Notifications</div>
    <div className="profile-btn">Location</div>
    <div className="profile-btn">Feedback</div>
    <div className="profile-btn">Report a Bug</div>
  </>
)}
<AnimatePresence mode="wait">
  <motion.div
    key={profileView}
    initial={{ scale: 0.92, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.96, opacity: 0 }}
    transition={{
      duration: 0.28,
      ease: "easeOut"
    }}
  >

{profileView === "manage" && (
  <>

    <h1 className="profile-title">Manage Profile</h1>
    <div className="profile-divider" />

    <div className="profile-avatar-large" />

    <div className="profile-btn with-arrow">Your Name</div>
    <div className="profile-btn with-arrow">Username</div>
    <div className="profile-btn with-arrow">Gender</div>

    <div
      className="profile-btn back-btn"
      onClick={() => setProfileView("main")}
    >
      Back
    </div>
  </>
)}

{profileView === "security" && (
  <>

    <h1 className="profile-title">Password & Security</h1>
    <div className="profile-divider" />

    <div className="profile-btn with-arrow">Change Password</div>
    <div className="profile-btn with-arrow">Email Address</div>
    <div className="profile-btn with-arrow">Username</div>

    <div
      className="profile-btn back-btn"
      onClick={() => setProfileView("main")}
    >
      Back
    </div>
  </>
)}

{profileView === "themes" && (
  <>
  <div className="profile-header-row">
  <span
    className="back-arrow"
    onClick={() => setProfileView("main")}
  >
    ←
  </span>
</div>
    <h1 className="profile-title">Select Theme</h1>
    <p className="theme-subtitle">
  Choose the spiritual atmosphere of your app
</p>
    <div className="profile-divider" />

    {Object.entries(themes).map(([key, value]) => (
      <motion.div
  key={key}
  className={`profile-btn theme-card ${
    currentTheme === key ? "active-theme" : ""
  }`}
  style={{ background: value.headerGradient }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  whileDrag={{ rotateX: 3, rotateY: -3 }}
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * 8;
    const rotateY = ((x / rect.width) - 0.5) * -8;
    e.currentTarget.style.transform =
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }}
  onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRippleOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    handleThemeChange(key);
  }}
>
  <div className="theme-card-overlay" />

  <div className="theme-card-content">
    <span className="theme-name">{value.name}</span>

    <div className="theme-preview">
      <span style={{ background: value.headerGradient }} />
      <span style={{ background: value.navBackground }} />
      <span style={{ background: value.cardBackground }} />
    </div>
  </div>
</motion.div>
    ))}
  </>
)}
</motion.div>
</AnimatePresence>
      </div>
    </motion.div>
  )}
</motion.div>
{showProfileSheet && (
  <motion.div
    className="header-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => {
  setShowProfileSheet(false);
  setHeaderExpanded(false);
  setProfileView("main");
  setActiveNav("home");
}}
  />
)}



<AnimatePresence>
  {activeOffsetPrayer && (
    <>
      <motion.div
        className="offset-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setActiveOffsetPrayer(null)}
      />

      <motion.div
  className="offset-modal-container"
  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
  animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
  transition={{ duration: 0.4 }}
>
        <SingleOffsetModal
          prayer={activeOffsetPrayer}
          onClose={() => setActiveOffsetPrayer(null)}
          offsets={offsets}
          setOffsets={setOffsets}
          user={user}
          prayerTimes={prayerTimes}
          parseTimeToMinutes={parseTimeToMinutes}
          prayerGradient={getPrayerSky(activeOffsetPrayer)}
        />
      </motion.div>
    </>
  )}
</AnimatePresence>

<div className="floating-particles">
  {Array.from({ length: 8 }).map((_, i) => (
    <span key={i} />
  ))}
</div>

<AnimatePresence>
  {themeTransitioning && (
    <motion.div
      className="theme-transition-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Soft Ripple */}
      <motion.div
        className="ripple-light"
        initial={{ scale: 0.8, opacity: 0.4 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Geometric Texture Fade */}
      <motion.div
        className="geo-pattern"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 0.6 }}
      />

      {/* Silk Cloth Bottom Wipe */}
      <motion.div
        className="silk-wipe"
        initial={{ y: "100%" }}
        animate={{ y: "-10%" }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1]
        }}
      />
    </motion.div>
  )}
</AnimatePresence>

    </motion.div>
  );
}

export default Home;