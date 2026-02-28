import { useEffect, useState } from "react";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { motion } from "framer-motion";

export default function AppLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Loading assets...");

  useEffect(() => {
    const assets = [
      "/assets/fajr/moon.png",
      "/assets/fajr/cloud1.png",
      "/assets/fajr/cloud2.png",
      "/assets/fajr/small-cloud.png",
      "/assets/fajr/star1.png",
      "/assets/fajr/star2.png",
      "/assets/fajr/star3.png",
      "/assets/dhuhr/sun.png",
      "/assets/dhuhr/cloud.png",
      "/assets/dhuhr/cloud-small.png",
      "/assets/asr/sun.png",
      "/assets/asr/cloud1.png",
      "/assets/asr/cloud2.png",
      "/assets/maghrib/sun.png",
      "/assets/maghrib/cloud1.png",
      "/assets/maghrib/cloud2.png",
      "/assets/isha/moon.png",
      "/assets/isha/cloud1.png",
      "/assets/isha/cloud2.png",
      "/assets/isha/star1.png",
      "/assets/isha/star2.png",
      "/assets/isha/star3.png",
      "/assets/tracker.png",
      "/assets/qibla.png",
      "/assets/tasbih.png",
      "/assets/calendar.png",
      "/assets/mosque.png"
    ];

    let loaded = 0;

    async function preload() {
      for (let src of assets) {
        const img = new Image();
        img.src = src;

        await new Promise((resolve) => {
          img.onload = async () => {
            try { await img.decode(); } catch {}
            resolve();
          };
          img.onerror = resolve;
        });

        loaded++;
        const percent = Math.round((loaded / assets.length) * 100);
        setProgress(percent);

        // 🔥 Slower message transitions
        if (percent < 35) setMessage("Loading assets...");
        else if (percent < 70) setMessage("Preparing visuals...");
        else setMessage("Optimizing experience...");
      }

      setTimeout(onComplete, 600);
    }

    preload();
  }, []);

  useEffect(() => {
  function handleMove(e) {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    document.querySelector(".loader-logo").style.transform =
      `translate(${x}px, ${y}px)`;
  }

  window.addEventListener("mousemove", handleMove);
  return () => window.removeEventListener("mousemove", handleMove);
}, []);

  return (
    <motion.div
      className="app-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >

      {/* LOGO WRAPPER */}
<div className="logo-wrapper">

  {/* Ambient Glow Behind Logo */}
  <div className="logo-glow" />

  {/* FULL LOGO */}
  <motion.img
    src="/assets/logo/qaym-full-logo.png"
    className="loader-logo"
    initial={{ scale: 0.92, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.9, ease: "easeOut" }}
  />

</div>

      {/* MESSAGE */}
      <motion.div
        key={message}
        className="loader-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.6 }}
      >
        {message}
      </motion.div>

      {/* PERCENT */}
      <div className="loader-progress">
        {progress}%
      </div>

      {/* DOTS */}
      <div style={{ marginTop: 16 }}>
        <DotPulse size="42" speed="1.1" color="#ffffff" />
      </div>

    </motion.div>
  );
}