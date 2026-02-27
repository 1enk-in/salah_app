import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence,
  fetchSignInMethodsForEmail,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import "../styles/login.css";
import envelopeImg from "../assets/envelope-3d.jpg";
import loginVideo from "../assets/login-bg.mp4";
import salahLogo from "../assets/salah-calligraphy.png";
import catHeadOpen from "../assets/cat-head-open.png";
import catHandsOpen from "../assets/cat-hands-open.png";
import catHeadClosed from "../assets/cat-head-closed.png";
import catHandsClosed from "../assets/cat-hands-closed.png";
import leftPawOpen from "../assets/leftPawOpen.png";
import rightPawOpen from "../assets/rightPawOpen.png";
import leftPawClosed from "../assets/leftPawClosed.png";
import rightPawClosed from "../assets/rightPawClosed.png";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
const [checkingEmail, setCheckingEmail] = useState(false);
const [confirmPassword, setConfirmPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [passwordFocused, setPasswordFocused] = useState(false);
const [focusedField, setFocusedField] = useState(null);
const catLifted = !!statusMessage;
const [emailValid, setEmailValid] = useState(null); 
const [shakeEmail, setShakeEmail] = useState(false);
const [emailSuggestion, setEmailSuggestion] = useState("");

  const [verificationPending, setVerificationPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [authStep, setAuthStep] = useState("select");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isClosed =
  (focusedField === "password" && showPassword) ||
  (focusedField === "confirm" && showConfirmPassword);

  useEffect(() => {
  if (isClosed) return; // 🚫 STOP blinking when eyes covered

  const interval = setInterval(() => {
    const eyes = document.querySelectorAll(".eye");

    eyes.forEach(eye => {
      eye.classList.add("blink");
    });

    setTimeout(() => {
      eyes.forEach(eye => {
        eye.classList.remove("blink");
      });
    }, 200);

  }, 3500);

  return () => clearInterval(interval);
}, [isClosed]);

  useEffect(() => {
  if (!isRegister || !email) {
    setEmailExists(false);
    return;
  }

  const checkEmail = async () => {
    try {
      setCheckingEmail(true);

      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        setEmailExists(true);

        setStatusMessage({
          type: "error",
          text: "Account already exists. Please sign in."
        });
      } else {
        setEmailExists(false);
      }

    } catch {
      // ignore network check errors
    } finally {
      setCheckingEmail(false);
    }
  };

  const debounce = setTimeout(checkEmail, 600);
  return () => clearTimeout(debounce);

}, [email, isRegister]);


  // ⏳ Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateEmail(value) {
  if (!value) {
    setEmailValid(null);
    return;
  }

  setEmailValid(isValidEmail(value));
}

function triggerShake() {
  setShakeEmail(true);
  setTimeout(() => setShakeEmail(false), 400);
}

function generateSuggestion(value) {
  if (!value.includes("@")) {
    setSuggestion("");
    return;
  }

  const [name, domain] = value.split("@");

  const commonDomains = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "hotmail.com"
  ];

  if (!domain) return;

  const match = commonDomains.find(d =>
    d.startsWith(domain)
  );

  if (match && match !== domain) {
    setSuggestion(`${name}@${match}`);
  } else {
    setSuggestion("");
  }
}

/* ============================
   INLINE EMAIL PREDICT SYSTEM
============================ */

const commonDomains = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "hotmail.com"
];

function handleEmailChange(value) {
  const clean = value
    .toLowerCase()
    .replace(/\s/g, "");

  setEmail(clean);
    validateEmail(clean);
  generateInlineSuggestion(clean);
}

function generateInlineSuggestion(value) {
  if (!value.includes("@")) {
    setEmailSuggestion("");
    return;
  }

  const [name, domain] = value.split("@");

  if (!domain) {
    setEmailSuggestion("");
    return;
  }

  // Smart typo corrections
  const typoFixes = {
    gmial: "gmail.com",
    gamil: "gmail.com",
    gmil: "gmail.com",
    hotnail: "hotmail.com"
  };

  if (typoFixes[domain]) {
    setEmailSuggestion(
      typoFixes[domain].slice(domain.length)
    );
    return;
  }

  const match = commonDomains.find(d =>
    d.startsWith(domain)
  );

  if (match && match !== domain) {
    setEmailSuggestion(
      match.slice(domain.length)
    );
  } else {
    setEmailSuggestion("");
  }
}

function handleEmailKeyDown(e) {
  if (
    (e.key === "Tab" ||
     e.key === "Enter" ||
     e.key === "ArrowRight") &&
    emailSuggestion
  ) {
    e.preventDefault();

    const completed = email + emailSuggestion;

    setEmail(completed);
    setEmailSuggestion("");

    // ✅ FORCE VALIDATION AFTER AUTOCOMPLETE
    validateEmail(completed);

    requestAnimationFrame(() => {
      const input = document.querySelector(
        ".email-predict-wrapper input"
      );
      if (input) {
        input.setSelectionRange(
          completed.length,
          completed.length
        );
      }
    });
  }
}

  function handleAuthError(err) {
  let message = "Authentication failed";

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      message = "Invalid email or password";
      break;

    case "auth/user-not-found":
      message = "Account not found";
      break;

    case "auth/too-many-requests":
      message = "Too many attempts. Try again later";
      break;

    case "auth/network-request-failed":
      message = "Network error. Check connection";
      break;

    case "auth/weak-password":
  message = "Password must be at least 6 characters";
  break;
  }

  setStatusMessage({
    type: "error",
    text: message
  });

  setTimeout(() => setStatusMessage(null), 2500);
}

  async function handleSubmit(e) {
  e.preventDefault();
  setStatusMessage(null);

  const cleanEmail = email.trim().toLowerCase();

  // 🔥 BLOCK INVALID EMAIL FIRST
  if (!isValidEmail(cleanEmail)) {
    setEmailValid(false);
    triggerShake();

    setStatusMessage({
      type: "error",
      text: "Please enter a valid email address"
    });

    return;
  }

  setEmailValid(true);

  // 🔐 PASSWORD VALIDATION
  if (password.length < 6) {
    setStatusMessage({
      type: "error",
      text: "Password must be at least 6 characters"
    });
    return;
  }

  if (isRegister && password !== confirmPassword) {
    setStatusMessage({
      type: "error",
      text: "Passwords do not match"
    });
    return;
  }

    try {
      await setPersistence(
        auth,
        rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      if (isRegister) {
  try {
    const userCredential =
      await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCredential.user);

    setStatusMessage({
      type: "success",
      text: "Email Sent ✔"
    });

    setTimeout(() => setStatusMessage(null), 2500);

    await signOut(auth);

    setVerificationPending(true);
    setCooldown(60);

    return;

  } catch (err) {

    if (
  err.code === "auth/email-already-in-use" ||
  err.code === "auth/invalid-credential" ||
  err.code === "auth/wrong-password"
) {

      setStatusMessage({
        type: "error",
        text: "Account already exists. Please sign in."
      });

      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    handleAuthError(err);
    return;
  }
}

      const userCredential =
        await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setVerificationPending(true);
        return;
      }

    } catch (err) {
      handleAuthError(err);
    }
  }

  async function handleGoogleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    // Optional: block if email not verified
    if (!result.user.emailVerified) {
      await signOut(auth);
      setStatusMessage({
  type: "error",
  text: "Please verify your email first"
});

setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

  } catch (err) {
    handleAuthError(err);
  }
}

  async function handleCheckVerification() {
  try {
    setChecking(true);
    setStatusMessage(null);

      const userCredential =
        await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
  await signOut(auth);

  setStatusMessage({
    type: "error",
    text: "Email not verified yet"
  });

  setTimeout(() => setStatusMessage(null), 2500);
  return;
}

    } catch (err) {
      handleAuthError(err);
    } finally {
      setChecking(false);
    }
  }

  async function handleResendVerification() {
    if (cooldown > 0) return;

    try {
      const userCredential =
        await signInWithEmailAndPassword(auth, email, password);

      await sendEmailVerification(userCredential.user);
await signOut(auth);

setCooldown(60);

setStatusMessage({
  type: "success",
  text: "Email Sent ✔"
});

setTimeout(() => setStatusMessage(null), 2500);

    } catch (err) {

      if (err.code === "auth/too-many-requests") {
  setStatusMessage({
    type: "error",
    text: "Please wait before requesting again"
  });

  setTimeout(() => setStatusMessage(null), 2500);
} else {
        handleAuthError(err);
      }
    }
  }

  async function handleForgotPassword() {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    setStatusMessage({
      type: "error",
      text: "Please enter your email"
    });
    triggerShake();
    return;
  }

  if (!isValidEmail(cleanEmail)) {
    setStatusMessage({
      type: "error",
      text: "Please enter a valid email address"
    });
    setEmailValid(false);
    triggerShake();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);

    setStatusMessage({
      type: "success",
      text: "Check your inbox for a password reset link ✔"
    });

  } catch (err) {
    handleAuthError(err);
  }
}



  // 🔐 VERIFICATION SCREEN
  if (verificationPending) {
  return (
    <div className="verify-wrapper">
      <video
  className="auth-video"
  autoPlay
  muted
  loop
  playsInline
>
  <source src={loginVideo} type="video/mp4" />
</video>

      <div className="verify-card">

  <div className="verify-envelope">
    <img src={envelopeImg} alt="Email Verification" className="envelope-img" />
    <div className="envelope-check">✓</div>
  </div>

  {statusMessage && (
    <div className={`status-badge ${statusMessage.type}`}>
      {statusMessage.text}
    </div>
  )}

  <h2 className="verify-heading">
    Confirm your email
  </h2>

  <p className="verify-sub">
    Please confirm your email address by clicking
    the verification link we sent to:
  </p>

  <div className="verify-email">
    {email}
  </div>

  {/* 🔔 Spam Notice */}
  <div className="verify-spam-note">
    Didn’t receive the email? Please check your <strong>Spam</strong> or 
    <strong> Junk</strong> folder. Firebase emails may sometimes land there.
  </div>

  <button
    className="verify-primary-btn"
    onClick={handleCheckVerification}
    disabled={checking}
  >
    {checking ? "Checking..." : "Check Verification"}
  </button>

  <button
    className="verify-resend-btn"
    onClick={handleResendVerification}
    disabled={cooldown > 0}
  >
    {cooldown > 0
      ? `Resend email in ${cooldown}s`
      : "Resend Email"}
  </button>

</div>
    </div>
  );
}



  // NORMAL LOGIN
return (
  <div className="auth-wrapper">

    <video
      className="auth-video"
      autoPlay
      muted
      loop
      playsInline
    >
      <source src={loginVideo} type="video/mp4" />
    </video>

    <div className="auth-bg" />

    <div className={`auth-content ${isTransitioning ? "content-fade" : ""}`}>

      {authStep === "select" ? (

  <>
    <div className="logo-wrapper">
      <img
        src={salahLogo}
        alt="Salah"
        className="salah-logo"
      />
      <p className="logo-sub">
        Companion
      </p>
    </div>

    <div className="auth-choice-clean">

      <button
        className="primary-btn large"
        onClick={() => {
          setIsTransitioning(true);

          setTimeout(() => {
            setAuthStep("email");
            setIsTransitioning(false);
          }, 250);
        }}
      >
        Continue with Email
      </button>

      <button
        className="google-btn large"
        onClick={handleGoogleLogin}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="google-icon"
        />
        Continue with Google
      </button>

    </div>
  </>

      ) : (

        /* ================= EMAIL SCREEN ================= */
        <>

          <button
            type="button"
            className="back-floating-btn"
            onClick={() => {
              setIsTransitioning(true);

              setTimeout(() => {
                setAuthStep("select");
                setIsTransitioning(false);
              }, 250);
            }}
          >
            <span className="back-icon">←</span>
          </button>

          <div className="logo-wrapper">
            <img
              src={salahLogo}
              alt="Salah"
              className="salah-logo"
            />
            <p className="logo-sub">
              Companion
            </p>
          </div>

          {statusMessage && (
            <div className={`status-badge-login ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          <div
            className={`cat-wrapper 
              ${focusedField ? "visible" : ""} 
              ${catLifted ? "lifted" : ""}
            `}
          >

            <div className="cat-eyes">
              <div className="eye">
                <div className="pupil"></div>
                <div className="eyelid"></div>
              </div>

              <div className="eye">
                <div className="pupil"></div>
                <div className="eyelid"></div>
              </div>
            </div>

            <img
              src={
                (focusedField === "password" && showPassword) ||
                (focusedField === "confirm" && showConfirmPassword)
                  ? catHeadClosed
                  : catHeadOpen
              }
              className="cat-head"
              alt="cat"
            />

            <div className="cat-paws-wrapper">

              <img
                src={leftPawOpen}
                className={`paw paw-open-left ${isClosed ? "hide" : "show"}`}
                alt=""
              />

              <img
                src={rightPawOpen}
                className={`paw paw-open-right ${isClosed ? "hide" : "show"}`}
                alt=""
              />

              <img
                src={leftPawClosed}
                className={`paw paw-close-left ${isClosed ? "show" : "hide"}`}
                alt=""
              />

              <img
                src={rightPawClosed}
                className={`paw paw-close-right ${isClosed ? "show" : "hide"}`}
                alt=""
              />

            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">

            <div
  className={`email-predict-wrapper 
    ${emailValid === true ? "valid" : ""} 
    ${emailValid === false ? "invalid" : ""} 
    ${shakeEmail ? "shake" : ""}
  `}
  onMouseDown={(e) => {
    if (emailSuggestion) {
      e.preventDefault(); // 👈 prevents caret jumping first

      const completed = email + emailSuggestion;

      setEmail(completed);
      setEmailSuggestion("");
      validateEmail(completed);
    }
  }}
>
  <div className="email-ghost">
    {email}
    <span className="ghost-text">
      {emailSuggestion}
    </span>
  </div>

  <input
    type="email"
    placeholder="Email"
    value={email}
    onChange={(e) => handleEmailChange(e.target.value)}
    onBlur={() => {
  if (!isValidEmail(email)) {
    triggerShake();
  }
}}
    onKeyDown={handleEmailKeyDown}
    autoComplete="off"
    required
  />
</div>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) =>
  setPassword(e.target.value.replace(/\s/g, ""))
}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
              />

              <button
                type="button"
                className={`password-toggle ${showPassword ? "active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword(prev => !prev)}
              >
                <svg viewBox="0 0 24 24" className="eye-svg">
                  <path
                    d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12z"
                    className="eye-outline"
                  />
                  <circle cx="12" cy="12" r="3" className="eye-pupil" />
                  <line
                    x1="4"
                    y1="4"
                    x2="20"
                    y2="20"
                    className="eye-strike"
                  />
                </svg>
              </button>
            </div>

            {isRegister && (
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) =>
  setConfirmPassword(e.target.value.replace(/\s/g, ""))
}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  required
                />

                <button
                  type="button"
                  className={`password-toggle ${showConfirmPassword ? "active" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  <svg viewBox="0 0 24 24" className="eye-svg">
                    <path
                      d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12z"
                      className="eye-outline"
                    />
                    <circle cx="12" cy="12" r="3" className="eye-pupil" />
                    <line
                      x1="4"
                      y1="4"
                      x2="20"
                      y2="20"
                      className="eye-strike"
                    />
                  </svg>
                </button>
              </div>
            )}

            <button
              className="primary-btn"
              disabled={isRegister && emailExists}
            >
              {isRegister ? "Sign Up" : "Sign In"}
            </button>

            <p className="switch-text">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <span onClick={() => setIsRegister(false)}>
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span onClick={() => setIsRegister(true)}>
                    Sign Up
                  </span>
                </>
              )}
            </p>

            {!isRegister && (
  <button
    type="button"
    className="forgot-password"
    onClick={handleForgotPassword}
  >
    Forgot your password?
  </button>
)}

          </form>

        </>
      )}

    </div>
  </div>
);
}