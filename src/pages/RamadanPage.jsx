import { useState, useEffect } from "react";
import { ramadan2026 } from "../data/ramadan2026";
import PrayerModal from "../components/PrayerModal";
import "../styles/RamadanPage.css";

export default function RamadanPage({ setScreen }) {
  const now = new Date();

const todayStr =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(now.getDate()).padStart(2, "0");
  const todayIndex = ramadan2026.findIndex(d => d.date === todayStr);

  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ramadan-page">

      <div className="ramadan-header">
        <button onClick={() => setScreen("home")} className="ramadan-back">
          ← Back
        </button>
        <h1>🌙 Ramadan 2026 Tracker</h1>
      </div>

      <div className="calendar-grid">

        {ramadan2026.map((day, index) => {
          let status = "upcoming";
          if (index < todayIndex) status = "past";
          if (index === todayIndex) status = "today";

          return (
            <div
              key={day.date}
              className={`calendar-card ${status}`}
              onClick={() => {
                if (status === "today" || status === "past") {
                  setSelectedDay(day);
                }
              }}
            >
              <div className="card-header">
  <div className="left-header">
   {day.taraweehOnly
    ? "🌙 Chaand Raat"
    : `رمضان ${day.day}`}
  </div>

  <div className="right-header">
    <span className="greg">
      {new Date(day.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short"
      })}
    </span>

    {status === "upcoming" && (
      <span className="lock-icon">🔒</span>
    )}
  </div>
</div>

              {!day.taraweehOnly && (
  <div className="times">
    <span>{day.sehri}</span>
    <span>{day.iftar}</span>
  </div>
)}

              {status === "today" && (
                <div className="today-indicator">TODAY</div>
              )}

              {status === "upcoming" && (
  <div className="locked-label">Locked</div>
)}

              {status === "past" && (
                <div className="past-indicator">Completed</div>
              )}

            </div>
          );
        })}

      </div>

      {selectedDay && (
        <PrayerModal
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}

    </div>
  );
}