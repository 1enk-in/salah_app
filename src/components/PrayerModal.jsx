import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function PrayerModal({ day, onClose }) {
  const { user } = useAuth();
  const year = "2026";

  const mainPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  const extraPrayers = ["taraweeh", "tahajjud"];
  const isChaandRaat = day.taraweehOnly;

  const [progress, setProgress] = useState({});
  const [activePrayer, setActivePrayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const ref = doc(db, "users", user.uid, "ramadanProgress", year);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProgress(snap.data()[day.date] || {});
      }

      setLoading(false);
    };

    load();
  }, [user, day.date]);

  const saveProgress = async (updatedDay) => {
    const ref = doc(db, "users", user.uid, "ramadanProgress", year);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};

    await setDoc(ref, {
      ...existing,
      [day.date]: updatedDay,
    });

    setProgress(updatedDay);
  };

  const handleStatus = async (prayer, status) => {
    const updated = {
      ...progress,
      [prayer]: { status, mode: null },
    };

    await saveProgress(updated);

    if (status !== "on_time") {
      setActivePrayer(null);
    }
  };

  const handleMode = async (prayer, mode) => {
    const updated = {
      ...progress,
      [prayer]: { status: "on_time", mode },
    };

    await saveProgress(updated);
    setActivePrayer(null);
  };

  const toggleExtra = async (prayer) => {
    const updated = {
      ...progress,
      [prayer]: !progress[prayer],
    };

    await saveProgress(updated);
  };

  if (loading) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        setActivePrayer(null);
        onClose();
      }}
    >
      <div
        className="prayer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="prayer-header">
          <div className="prayer-title">
            🌙 RAMADAN {day.day}
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="prayer-list">
          {isChaandRaat ? (
            <div
              className={`prayer-row ${
                progress.taraweeh ? "green" : ""
              }`}
              onClick={() => toggleExtra("taraweeh")}
            >
              <span className="prayer-name">Taraweeh</span>
              <div className="circle">
                {progress.taraweeh && "✓"}
              </div>
            </div>
          ) : (
            <>
              {mainPrayers.map((p) => {
                const data = progress[p] || {};
                const status = data.status;
                const isOpen = activePrayer === p;

                const isFriday =
  new Date(day.date).getDay() === 5;

const displayName =
  p === "dhuhr" && isFriday
    ? "jumu'ah"
    : p;

                return (
                  <div
  key={p}
  className={`prayer-row ${
    status === "on_time"
      ? "green"
      : status === "qaza"
      ? "yellow"
      : status === "missed"
      ? "red"
      : ""
  }`}
  onClick={() => {
    if (activePrayer === p) {
      setActivePrayer(null);
    } else {
      setActivePrayer(p);
    }
  }}
>
                    {/* LEFT SIDE */}
                    <div
                      className="row-left"
                      onClick={() =>
                        !isOpen && setActivePrayer(p)
                      }
                    >
                      <span className="prayer-name">
                        {displayName.charAt(0).toUpperCase() +
                         displayName.slice(1)}
                      </span>

                      {!isOpen && status && (
                        <span
                          className={`status-badge ${status}`}
                        >
                          {status === "on_time" &&
                            (progress[p]?.mode ===
                            "jamaat"
                              ? "On Time • Jamaat"
                              : progress[p]?.mode ===
                                "alone"
                              ? "On Time • Alone"
                              : "On Time")}

                          {status === "qaza" && "Qaza"}
                          {status === "missed" &&
                            "Missed"}
                        </span>
                      )}
                    </div>

                    {/* RIGHT SIDE CIRCLE (ONLY WHEN CLOSED) */}
                    {!isOpen && (
                      <div
                        className="circle"
                        onClick={() =>
                          setActivePrayer(p)
                        }
                      >
                        {status && "✓"}
                      </div>
                    )}

                    {/* ACTION SHEET (ONLY WHEN OPEN) */}
                    {isOpen && (
                      <div
                        className="compact-sheet"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <div className="status-segment">
  <div
    className="segment-indicator"
    style={{
      transform:
        status === "on_time"
          ? "translateX(0%)"
          : status === "qaza"
          ? "translateX(100%)"
          : "translateX(200%)"
    }}
  />

  <button
    className={`segment-btn ${
      status === "on_time" ? "active" : ""
    }`}
    onClick={() => handleStatus(p, "on_time")}
  >
    On Time
  </button>

  <button
    className={`segment-btn ${
      status === "qaza" ? "active" : ""
    }`}
    onClick={() => handleStatus(p, "qaza")}
  >
    Qaza
  </button>

  <button
    className={`segment-btn ${
      status === "missed" ? "active" : ""
    }`}
    onClick={() => handleStatus(p, "missed")}
  >
    Missed
  </button>
</div>

                        {status === "on_time" && (
                          <div className="mode-toggle">
                            <button
                              className={`mode-pill ${
                                progress[p]?.mode ===
                                "jamaat"
                                  ? "active-mode"
                                  : ""
                              }`}
                              onClick={() =>
                                handleMode(
                                  p,
                                  "jamaat"
                                )
                              }
                            >
                              🤝 Jamaat
                            </button>

                            <button
                              className={`mode-pill ${
                                progress[p]?.mode ===
                                "alone"
                                  ? "active-mode"
                                  : ""
                              }`}
                              onClick={() =>
                                handleMode(
                                  p,
                                  "alone"
                                )
                              }
                            >
                              🧍 Alone
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {extraPrayers.map((p) => (
                <div
                  key={p}
                  className={`prayer-row ${
                    progress[p] ? "green" : ""
                  }`}
                  onClick={() => toggleExtra(p)}
                >
                  <span className="prayer-name">
                    {p.charAt(0).toUpperCase() +
                      p.slice(1)}
                  </span>
                  <div className="circle">
                    {progress[p] && "✓"}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}