import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";
import getCroppedImg from "/utils/cropImage";
import Lottie from "lottie-react";
import photoAnimation from "../../../assets/photo.json";

export default function PhotoSlide({
  photoURL,
  setPhotoURL,
  onNext,
  setSwipeDisabled
}) {
  const [mode, setMode] = useState("idle"); 
  // idle | crop | uploading | success

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Disable swipe during crop / upload / success
  useEffect(() => {
    if (mode === "crop" || mode === "uploading" || mode === "success") {
      setSwipeDisabled(true);
    } else {
      setSwipeDisabled(false);
    }

    return () => setSwipeDisabled(false);
  }, [mode]);

  async function handleUpload() {
    try {
      setMode("uploading");

      const start = Date.now();

      const croppedBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels
      );

      const formData = new FormData();
      formData.append("file", croppedBlob);
      formData.append("upload_preset", "salah_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dx8sdafdx/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();

      // Minimum 3 sec loader
      const elapsed = Date.now() - start;
      const waitTime = Math.max(3000 - elapsed, 0);
      await new Promise(r => setTimeout(r, waitTime));

      setPhotoURL(data.secure_url);

      setMode("success");

      await new Promise(r => setTimeout(r, 1500));

      onNext();

    } catch (err) {
      console.error(err);
      setMode("idle");
    }
  }

  // ============================
  // SUCCESS SCREEN
  // ============================
  if (mode === "success") {
  return (
    <div className="status-screen">

      <div className="success-circle">
        ✓
      </div>

      <h3>Profile Photo Uploaded</h3>
      <p>Your profile now feels complete</p>

    </div>
  );
}

  // ============================
  // UPLOADING SCREEN
  // ============================
  if (mode === "uploading") {
  return (
    <div className="status-screen">
      <div className="status-loader"></div>

      <h3>Uploading Your Photo</h3>
      <p>Please wait a moment…</p>
    </div>
  );
}

 // ============================
// PREVIEW MODE (WHEN RETURNING)
// ============================

if (photoURL && mode === "idle") {
  return (
    <div className="green-slide-page green-slide">

      {/* IMAGE AT TOP LIKE ILLUSTRATION */}
      <div className="illustration-area-photo">
        <img
          src={photoURL}
          alt="Profile"
          className="preview-img-large"
        />
      </div>

      <div className="preview-text-block">
  <h2 className="preview-title">
    Your Profile Photo
  </h2>
</div>

      <div className="bottom-panel-photo preview-panel">

        <button
          className="secondary-glass-btn"
          onClick={() => {
            setPhotoURL("");
            setMode("idle");
          }}
        >
          Change Photo
        </button>

        <button
          className="primary-glass-btn"
          onClick={onNext}
        >
          Continue
        </button>

      </div>

    </div>
  );
}

// ============================
// CROP FULLSCREEN MODE
// ============================

if (mode === "crop") {
  return (
    <div className="crop-fullscreen">

      <div className="crop-header">
        <h2>Adjust Your Photo</h2>
        <p>Drag to reposition • Use slider to zoom</p>
      </div>

      <div className="crop-center">
        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      </div>

      <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) =>
          setZoom(Number(e.target.value))
        }
        className="zoom-slider"
      />

      <div className="crop-actions">
        <button
          className="secondary-glass-btn"
          onClick={() => {
            setImageSrc(null);
            setMode("idle");
          }}
        >
          Change Photo
        </button>

        <button
          className="primary-glass-btn"
          onClick={handleUpload}
        >
          Save Photo
        </button>
      </div>

    </div>
  );
}

  return (
  <div className="green-slide-page green-slide">

    {/* TOP ILLUSTRATION / LOTTIE */}
    {mode !== "crop" && mode !== "uploading" && mode !== "success" && (
  <div className="illustration-area">
    <Lottie
      animationData={photoAnimation}
      loop
      autoplay
      className="hero-lottie"
    />
  </div>
)}

    {/* TITLE */}
    <div className="text-block">
      <h2>Add Profile Photo</h2>
      <p>You can change it anytime</p>
    </div>

    {/* ===== BOTTOM PANEL ===== */}
    <div className="bottom-panel">

      {/* SUCCESS */}
      {mode === "success" && (
        <div className="success-wrapper">
          <div className="success-circle">
            <svg viewBox="0 0 52 52">
              <path
                className="checkmark-check"
                fill="none"
                d="M14 27l7 7 16-16"
              />
            </svg>
          </div>
          <p>Profile Photo Uploaded</p>
        </div>
      )}

      {/* UPLOADING */}
      {mode === "uploading" && (
        <div className="uploading-screen">
          <div className="loader-large"></div>
          <p>Uploading your profile photo...</p>
        </div>
      )}

      {/* PREVIEW MODE */}
      {photoURL && mode === "idle" && (
        <>
          <img
            src={photoURL}
            alt="Profile"
            className="preview-img"
          />

          <button
            className="secondary-glass-btn"
            onClick={() => {
              setPhotoURL("");
              setMode("idle");
            }}
          >
            Change Photo
          </button>

          <button
            className="primary-glass-btn"
            onClick={onNext}
          >
            Continue
          </button>
        </>
      )}

      {/* DEFAULT MODE */}
      {!photoURL && mode === "idle" && (
        <>
          <label className="upload-glass-btn">
            Choose Photo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                setImageSrc(
                  URL.createObjectURL(e.target.files[0])
                );
                setMode("crop");
              }}
            />
          </label>

          <button
            className="secondary-glass-btn"
            onClick={onNext}
          >
            Skip
          </button>
        </>
      )}

      {/* CROP MODE */}
      

    </div>
  </div>
);
}