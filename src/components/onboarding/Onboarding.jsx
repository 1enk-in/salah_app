import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UsernameSlide from "./slides/UsernameSlide";
import PhotoSlide from "./slides/PhotoSlide";
import LocationSlide from "./slides/LocationSlide";
import PrayerSlide from "./slides/PrayerSlide";
import "../../styles/onboarding.css";

export default function Onboarding({ setScreen }) {
  const [[step, direction], setStep] = useState([0, 0]);

  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [swipeDisabled, setSwipeDisabled] = useState(false);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");
  const [prayerTimes, setPrayerTimes] = useState({});

  const totalSlides = 4;

function paginate(newDirection) {
  setStep(([prev]) => {
    const next = prev + newDirection;

    if (next < 0 || next >= totalSlides) {
      return [prev, 0];
    }

    return [next, newDirection];
  });
}

  const slides = [
    <UsernameSlide
      username={username}
      setUsername={setUsername}
      onNext={() => paginate(1)}
    />,
    <PhotoSlide
  photoURL={photoURL}
  setPhotoURL={setPhotoURL}
  onNext={() => paginate(1)}
  setSwipeDisabled={setSwipeDisabled}
/>,
    <LocationSlide
      city={city}
      setCity={setCity}
      country={country}
      setCountry={setCountry}
      setTimezone={setTimezone}
      setPrayerTimes={setPrayerTimes}
      onNext={() => paginate(1)}
    />,
    <PrayerSlide
      username={username}
      photoURL={photoURL}
      city={city}
      country={country}
      timezone={timezone}
      prayerTimes={prayerTimes}
      setPrayerTimes={setPrayerTimes}
      onFinish={() => setScreen("home")}
    />
  ];

  const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 350 : -350,
    opacity: 0,
    scale: 0.96
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: 2
  },
  exit: (direction) => ({
    x: direction > 0 ? -350 : 350,
    opacity: 0,
    scale: 0.96,
    zIndex: 1
  })
};

function getCardGradient(step) {
  switch (step) {
    case 0:
      return "linear-gradient(180deg, #0d1164, #4c1d95)"; // purple
    case 1:
      return "linear-gradient(180deg, #0c2c55, #296374)"; // green
    case 2:
      return "linear-gradient(180deg, #08144e, #2845d6)"; // blue
    case 3:
      return "linear-gradient(180deg, #002147, #3b3c36)"; // odin
    default:
      return "linear-gradient(180deg, #7c3aed, #4c1d95)";
  }
}

  return (
    <div className="onboard-container">

      {/* Card Stack Illusion */}

      <motion.div
  className="onboard-card"
  animate={{ background: getCardGradient(step) }}
  transition={{
  duration: 1,
  ease: [0.4, 0, 0.2, 1] // smoother curve
}}
>

        {/* TOP NAV */}
        <div className="top-nav">
          {step > 0 ? (
            <button
              className="back-btn"
              onClick={() => paginate(-1)}
            >
              ➤
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* SLIDER */}
        <div className="slider-wrapper">

          <AnimatePresence
            initial={false}
            custom={direction}
            mode="wait"
          >
            <motion.div
              key={step}
              className="slide-content"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25
              }}
              drag={swipeDisabled ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(e, { offset }) => {
  if (swipeDisabled) return; // hard block

  const threshold = 120;

  if (offset.x < -threshold) {
    if (step === 2 && !city) return;
    paginate(1);
  }

  if (offset.x > threshold) {
    paginate(-1);
  }
}}
            >
              {slides[step]}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* SLIDE INDICATOR */}
        {step !== totalSlides - 1 && (
  <div className="slider-indicator">
    {slides.map((_, i) => (
      <div
        key={i}
        className={`dot ${i === step ? "active" : ""}`}
      />
    ))}
  </div>
)}

      </motion.div>
    </div>
  );
}