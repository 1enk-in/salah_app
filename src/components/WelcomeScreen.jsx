import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function WelcomeScreen({ username, onComplete }) {
  const textRef = useRef(null);
  const mosqueRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  const [canSkip, setCanSkip] = useState(false);
  const [exiting, setExiting] = useState(false);

  const displayName =
    username
      ?.split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "";

  useEffect(() => {
    const el = containerRef.current;
    const chars = textRef.current?.querySelectorAll(".char");

    if (!el || !chars) return;

    try {
      navigator.vibrate?.([40, 30, 60]);
    } catch {}

    audioRef.current?.play().catch(() => {});

    const tl = gsap.timeline({
      onComplete: () => {
        setCanSkip(true); // allow tap after animation finishes
      }
    });

    timelineRef.current = tl;

    tl.fromTo(
      mosqueRef.current,
      { opacity: 0, scale: 1.05 },
      { opacity: 0.08, scale: 1, duration: 1.1, ease: "power2.out" }
    );

    tl.fromTo(
      chars,
      { opacity: 0, y: 60, scale: 0.95, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.03,
        ease: "power4.out"
      },
      "-=0.7"
    );

    tl.to(
      textRef.current,
      {
        textShadow:
          "0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.15)",
        duration: 0.6,
        yoyo: true,
        repeat: 1
      },
      "-=0.6"
    );

    const sweep = el.querySelector(".light-sweep");
    if (sweep) {
      gsap.fromTo(
        sweep,
        { x: "-120%" },
        { x: "220%", duration: 3.5, ease: "power1.inOut" }
      );
    }

    function handleMove(e) {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(el, {
        rotateX: -y * 6,
        rotateY: x * 6,
        duration: 1.2,
        ease: "power3.out"
      });
    }

    function resetTilt() {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 1.4,
        ease: "power3.out"
      });
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", resetTilt);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", resetTilt);
      tl.kill();
    };
  }, []);

  function handleExit() {
    if (exiting) return;
    setExiting(true);

    const el = containerRef.current;

    gsap.to(el, {
      opacity: 0,
      scale: 1.02,
      duration: 0.7,
      ease: "power2.inOut",
      onComplete
    });
  }

  return (
    <div className="welcome-3d-wrapper" onClick={handleExit}>
      <div className="welcome-cinematic" ref={containerRef}>
        <div className="light-sweep" />

        <audio
          ref={audioRef}
          src="/assets/welcome.mp3"
          preload="auto"
        />

        <img
          ref={mosqueRef}
          src="/assets/mosque-silhouette.png"
          className="mosque-bg"
          alt=""
        />

        <div className="text-wrapper" ref={textRef}>
          {"Assalamu Alaikum".split("").map((letter, i) => (
            <span key={i} className="char">
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}

          <div className="welcome-meaning">
            (Peace be upon you)
          </div>
        </div>

        <div className="welcome-sub">{displayName}</div>

        {canSkip && (
          <div className="tap-continue">
            Tap anywhere to continue
          </div>
        )}
      </div>
    </div>
  );
}