import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./loginForm.module.css";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { login } from "@/pages/api/fetch";
import { HeaderLogo } from "@/components/Header/HeaderLogo";
import { Button } from "@/components/ui/button";

const MASCOT_PHOTO = "/login/remis@2x.png";
const EYE_ASSET = "/login/eye.svg";
const EYES_AWAY_ANGLE = -175;

// Eye center positions within the 209×159 mascot container (eyeball top-left + eye center offset)
const LEFT_EYE_CENTER = { x: 84 + 7.5, y: 68 + 6.5 };
const RIGHT_EYE_CENTER = { x: 110 + 7.5, y: 68 + 6.5 };

function getCursorViewportX(input: HTMLInputElement, cursorIndex: number): number {
  const rect = input.getBoundingClientRect();
  const style = window.getComputedStyle(input);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return rect.left + rect.width / 2;
  ctx.font = `${style.fontSize} ${style.fontFamily}`;
  const isPassword = input.type === "password";
  const sample = isPassword ? "•".repeat(cursorIndex) : input.value.slice(0, cursorIndex);
  const textWidth = ctx.measureText(sample).width;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  return rect.left + paddingLeft + textWidth - (input.scrollLeft || 0);
}

function computeEyeAngle(
  eyeCenter: { x: number; y: number },
  cursorViewport: { x: number; y: number },
  mascotRect: DOMRect
): number {
  const eyeVX = mascotRect.left + eyeCenter.x;
  const eyeVY = mascotRect.top + eyeCenter.y;
  const dx = cursorViewport.x - eyeVX;
  const dy = cursorViewport.y - eyeVY;
  // pupil rests pointing down (90°), subtract 90° so rotation 0 = looking down
  return Math.atan2(dy, dx) * (180 / Math.PI) - 90;
}

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [stalkerMode, setStalkerMode] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ceo_stalker_mode") === "true") setStalkerMode(true);
    } catch {}
  }, []);
  const [eyeMode, setEyeMode] = useState<"hidden" | "tracking" | "away">("hidden");
  const [leftEyeAngle, setLeftEyeAngle] = useState(0);
  const [rightEyeAngle, setRightEyeAngle] = useState(0);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const focusedField = useRef<"email" | "password" | null>(null);
  const router = useRouter();

  const trackEyes = useCallback((input: HTMLInputElement, cursorIndex: number) => {
    const mascot = mascotRef.current;
    if (!mascot) return;
    const cursorX = getCursorViewportX(input, cursorIndex);
    const inputRect = input.getBoundingClientRect();
    const cursorY = inputRect.top + inputRect.height / 2;
    const mascotRect = mascot.getBoundingClientRect();
    setLeftEyeAngle(computeEyeAngle(LEFT_EYE_CENTER, { x: cursorX, y: cursorY }, mascotRect));
    setRightEyeAngle(computeEyeAngle(RIGHT_EYE_CENTER, { x: cursorX, y: cursorY }, mascotRect));
  }, []);

  const handleEmailFocus = () => {
    focusedField.current = "email";
    setMascotVisible(true);
    if (email.length > 0) {
      setEyeMode("tracking");
      const input = emailRef.current;
      if (input) trackEyes(input, input.selectionStart ?? input.value.length);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value.length > 0) {
      setEyeMode("tracking");
      trackEyes(e.target, e.target.selectionStart ?? e.target.value.length);
    } else {
      setEyeMode("hidden");
    }
  };

  const handleEmailSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    trackEyes(e.currentTarget, e.currentTarget.selectionStart ?? e.currentTarget.value.length);
  };

  const handlePasswordFocus = () => {
    focusedField.current = "password";
    setMascotVisible(true);
    if (password.length > 0) {
      if (showPassword) {
        setEyeMode("tracking");
        const input = passwordRef.current;
        if (input) trackEyes(input, input.selectionStart ?? input.value.length);
      } else {
        setEyeMode("away");
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (e.target.value.length > 0) {
      if (showPassword) {
        setEyeMode("tracking");
        trackEyes(e.target, e.target.selectionStart ?? e.target.value.length);
      } else {
        setEyeMode("away");
      }
    } else {
      setEyeMode("hidden");
    }
  };

  const handlePasswordSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (eyeMode === "tracking") {
      trackEyes(e.currentTarget, e.currentTarget.selectionStart ?? e.currentTarget.value.length);
    }
  };

  const handleShowPasswordToggle = () => {
    const next = !showPassword;
    setShowPassword(next);
    if (focusedField.current === "password") {
      if (next) {
        setEyeMode("tracking");
        const input = passwordRef.current;
        if (input) trackEyes(input, input.selectionStart ?? input.value.length);
      } else {
        setEyeMode("away");
      }
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const response = await login({ email, password });
      if (response.status === 200) {
        Cookies.set("@user_jwt", response.data.jwt);
        setTimeout(() => router.push("/users"), 500);
        return;
      }
    } catch {
      setError(true);
    }
  };

  const eyesVisible = eyeMode !== "hidden";
  const leftAngle = eyeMode === "away" ? EYES_AWAY_ANGLE : leftEyeAngle;
  const rightAngle = eyeMode === "away" ? EYES_AWAY_ANGLE : rightEyeAngle;

  return (
    <div className={styles.wrapper}>
      {/* Mascot */}
      <div
        ref={mascotRef}
        className={`${styles.mascot} ${!stalkerMode ? styles.mascotOff : mascotVisible ? styles.mascotVisible : ""}`}
        aria-hidden="true"
      >
        <div className={styles.mascotPhotoClip}>
          <img
            src={MASCOT_PHOTO}
            className={styles.mascotPhoto}
            alt=""
            draggable={false}
          />
        </div>
        <img
          src={EYE_ASSET}
          className={styles.eyeLeft}
          style={{ transform: `rotate(${leftAngle}deg)`, opacity: eyesVisible ? 1 : 0 }}
          alt=""
          draggable={false}
        />
        <img
          src={EYE_ASSET}
          className={styles.eyeRight}
          style={{ transform: `rotate(${rightAngle}deg)`, opacity: eyesVisible ? 1 : 0 }}
          alt=""
          draggable={false}
        />
      </div>

      {/* Card */}
      <form className={styles.card} onSubmit={onSubmit}>
        {/* Logo */}
        <HeaderLogo mode="production" />

        {/* Email */}
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            ref={emailRef}
            className={styles.input}
            type="email"
            value={email}
            onChange={handleEmailChange}
            onSelect={handleEmailSelect}
            onFocus={handleEmailFocus}
            onBlur={() => { setMascotVisible(false); setEyeMode("hidden"); }}
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrap}>
            <input
              ref={passwordRef}
              className={`${styles.input} ${styles.passwordInput}`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              onSelect={handlePasswordSelect}
              onFocus={handlePasswordFocus}
              onBlur={() => { setMascotVisible(false); setEyeMode("hidden"); }}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeToggle}
              onClick={handleShowPasswordToggle}
              onMouseDown={e => e.preventDefault()}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l18 18M10.5 10.677A3 3 0 0013.323 13.5M6.362 6.368C4.33 7.78 2.706 9.788 2 12c1.273 3.942 5.023 7 10 7a11.08 11.08 0 005.635-1.362M9 5.458A11.05 11.05 0 0112 5c4.977 0 8.727 3.058 10 7-.408 1.265-1.078 2.41-1.96 3.385" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <Button className="w-full h-12 text-base font-semibold" type="submit">
          Login
        </Button>

        {isError && <p className={styles.error}>Your email or password is wrong</p>}

        <p className={styles.orText}>or continue with</p>

        <div className={styles.ssoRow}>
          <Button type="button" variant="outline" className="flex-1 h-12 text-base font-semibold gap-2.5 [&_svg]:size-6">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          <Button type="button" variant="outline" className="flex-1 h-12 text-base font-semibold gap-2.5 [&_svg]:size-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </Button>
        </div>

      </form>

      <button
        type="button"
        className={styles.stalkerRow}
        onClick={() => setStalkerMode(v => {
          const next = !v;
          try { localStorage.setItem("ceo_stalker_mode", String(next)); } catch {}
          if (v) { setEyeMode("hidden"); setMascotVisible(false); }
          return next;
        })}
      >
        <span className={styles.stalkerLabel}>CEO Stalker Mode:</span>
        <strong className={styles.stalkerValue}>{stalkerMode ? "ON" : "OFF"}</strong>
      </button>
    </div>
  );
};

export default LoginForm;
