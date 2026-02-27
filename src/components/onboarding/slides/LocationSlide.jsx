import { useState, useEffect } from "react";
import { indianCities } from "../../../data/indianCities";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import locationAnimation from "../../../assets/location.json";

export default function LocationSlide({
  setCity,
  setPrayerTimes,
  setTimezone,
  onNext
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  // 🔍 FUZZY SEARCH (contains instead of startsWith)
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const lower = query.toLowerCase();

    const filtered = indianCities
      .filter((c) =>
        c.city.toLowerCase().includes(lower)
      )
      .slice(0, 8);

    setResults(filtered);
  }, [query]);

  function highlightMatch(text) {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="highlight">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  }

  function convertTo12(time24) {
    const [hours, minutes] = time24.slice(0, 5).split(":");
    let h = parseInt(hours);
    let modifier = "AM";

    if (h >= 12) {
      modifier = "PM";
      if (h > 12) h -= 12;
    }

    if (h === 0) h = 12;

    return `${h}:${minutes} ${modifier}`;
  }

  async function handleDetectLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        setLoading(true);

        const { latitude, longitude } = position.coords;

        /* 1️⃣ Reverse Geocode → Get Real City */
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const geoData = await geoRes.json();

        const detectedCity =
          geoData.address.city ||
          geoData.address.town ||
          geoData.address.state_district ||
          "Your Location";

        setCity(detectedCity);

        /* 2️⃣ Fetch Prayer Times */
        const prayerRes = await fetch(
          `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=1`
        );

        const prayerData = await prayerRes.json();
        const timings = prayerData.data.timings;

        setPrayerTimes({
          fajr: convertTo12(timings.Fajr),
          dhuhr: convertTo12(timings.Dhuhr),
          asr: convertTo12(timings.Asr),
          maghrib: convertTo12(timings.Maghrib),
          isha: convertTo12(timings.Isha)
        });

        onNext();

      } catch (err) {
        console.error(err);
        alert("Could not detect location.");
      } finally {
        setLoading(false);
      }
    },
    () => alert("Location permission denied.")
  );
}

  async function detectPrayer() {
    if (!selectedCity) return;

    try {
      setLoading(true);

      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${selectedCity.city}&country=India&method=1`
      );

      const data = await res.json();
      const timings = data.data.timings;

      setPrayerTimes({
        fajr: convertTo12(timings.Fajr),
        dhuhr: convertTo12(timings.Dhuhr),
        asr: convertTo12(timings.Asr),
        maghrib: convertTo12(timings.Maghrib),
        isha: convertTo12(timings.Isha)
      });

      onNext();
    } catch {
      alert("Could not fetch prayer times.");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="blue-slide-page blue-slide">

    {/* ILLUSTRATION */}
    {!loading && (
      <div className="illustration-area-location">
        <Lottie
          animationData={locationAnimation}
          loop
          autoplay
          className="hero-lottie"
        />
      </div>
    )}

    {/* TITLE */}
    {!loading && (
      <div className="text-block">
        <h2>Select Your City</h2>
        <p>We’ll automatically detect accurate prayer times</p>
      </div>
    )}

    {/* LOADING FULLSCREEN */}
    {loading && (
      <div className="status-screen">
        <div className="status-loader"></div>
        <h3>Fetching Prayer Times</h3>
        <p>Please wait a moment…</p>
      </div>
    )}

    {/* NORMAL MODE */}
    {!loading && (
      <div className="bottom-panel-location">

        <div className="location-wrapper">

  <div className="input-wrapper">
    <span className="input-icon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="white"
        opacity="0.8"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
      </svg>
    </span>

    <input
      type="text"
      placeholder="Search your city..."
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setSelectedCity(null);
      }}
      className="glass-input with-icon"
    />
  </div>

  {/* DROPDOWN */}
  <AnimatePresence>
    {results.length > 0 && (
      <motion.div
        className="city-dropdown glass-dropdown"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {results.map((c, index) => (
          <div
            key={`${c.city}-${index}`}
            className={`city-item ${
              selectedCity?.city === c.city ? "selected" : ""
            }`}
            onClick={() => {
              setSelectedCity(c);
              setCity(c.city);
              setQuery(c.city);
              setResults([]);
            }}
          >
            <div className="city-main">
              {highlightMatch(c.city)}
            </div>
            <div className="city-sub">
              {c.state}, India
            </div>
          </div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>

  {/* 🔥 INSERT HERE */}
  <button
    className="detect-location-btn"
    onClick={handleDetectLocation}
  >
    📍 Detect My Location
  </button>

</div>

{/* CONTINUE BUTTON (stays below) */}
<button
  className="primary-glass-btn"
  disabled={!selectedCity}
  onClick={detectPrayer}
>
  Continue
</button>

      </div>
    )}

  </div>
);
}