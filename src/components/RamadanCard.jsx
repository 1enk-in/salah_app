import { useState, useEffect } from "react";
import { ramadan2026 } from "../data/ramadan2026";
import "../styles/ramadanCard.css";

export default function RamadanHomeCard({ setScreen, setShowPrayerOverlay }) {
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    function updateNextPrayer() {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      const today = ramadan2026.find(d => d.date === todayStr);
      if (!today) return;

      const prayerTimes = [
        { name: "Fajr", time: today.sehri },
        { name: "Maghrib", time: today.iftar }
      ];

      for (let prayer of prayerTimes) {
        const [time, period] = prayer.time.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const prayerDate = new Date(today.date);
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate > now) {
          setNextPrayer({
            name: prayer.name,
            time: prayer.time
          });
          return;
        }
      }

      const tomorrow = ramadan2026.find(
        d => new Date(d.date) > new Date(today.date)
      );

      if (tomorrow) {
        setNextPrayer({
          name: "Fajr",
          time: tomorrow.sehri
        });
      }
    }

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="ramadan-home-card"
      onClick={() => setScreen("home")}
    >

      <div className="ramadan-prayer-content">
        <div className="ramadan-label">Next Prayer</div>

        {nextPrayer ? (
          <>
            <div className="ramadan-prayer-name">
              {nextPrayer.name}
            </div>
            <div className="ramadan-prayer-time">
              {nextPrayer.time}
            </div>
          </>
        ) : (
          <div className="ramadan-prayer-name">
            Not Ramadan
          </div>
        )}
      </div>
    </div>
  );
}