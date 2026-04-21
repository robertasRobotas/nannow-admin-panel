import styles from "../styles/Home.module.css";
import logo from "../assets/images/logo-admin.svg";
import googleLogo from "../assets/images/google-logo.svg";
import appleLogo from "../assets/images/apple-logo.svg";
import Input from "@/components/Input/Input";
import { useState } from "react";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";
import {
  login,
  loginWithFirebase,
  verifyAdminLoginTotp,
} from "./api/fetch";
import axios from "axios";
import Cookies from "js-cookie";
import { getFirebaseAuth } from "@/helpers/firebaseClient";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const MainPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [isTotpVerifying, setIsTotpVerifying] = useState(false);

  const router = useRouter();

  const loginErrorDetail = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        const data = err.response.data;
        const body =
          typeof data === "string"
            ? data
            : data && typeof data === "object" && "message" in data
              ? String((data as { message?: unknown }).message)
              : JSON.stringify(data);
        return `(${err.response.status}) ${body.slice(0, 200)}`;
      }
      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        return "Network error — often CORS: the API must allow http://localhost:3000";
      }
    }
    return err instanceof Error ? err.message : String(err);
  };

  const completeLogin = (jwt: string) => {
    Cookies.set("@user_jwt", jwt);
    setTimeout(() => {
      router.push("/users");
    }, 500);
  };

  const handleAuthResponse = (response: {
    status: number;
    data: {
      jwt?: string;
      requires2fa?: boolean;
      mfaToken?: string;
    };
  }) => {
    if (response.status !== 200) return;

    if (response.data.requires2fa && response.data.mfaToken) {
      setMfaToken(response.data.mfaToken);
      setTotpCode("");
      setAuthErrorMessage("");
      setIsError(false);
      return;
    }

    if (response.data.jwt) {
      completeLogin(response.data.jwt);
      return;
    }

    setIsError(true);
    setAuthErrorMessage("Login response was incomplete. Check API mode (prod vs test).");
  };

  const onSubmit = async () => {
    if (isLoading) return;
    setIsError(false);
    setAuthErrorMessage("");
    setIsLoading(true);
    try {
      const loginData = {
        email: email,
        password: password,
      };

      const response = await login(loginData);
      handleAuthResponse(response);
    } catch (err) {
      setIsError(true);
      setAuthErrorMessage(
        process.env.NODE_ENV === "development"
          ? loginErrorDetail(err)
          : "Your email or password is wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const completeFirebaseLogin = async (provider: "google" | "apple") => {
    if (isGoogleLoading || isAppleLoading) return;
    setIsError(false);
    setAuthErrorMessage("");
    try {
      if (provider === "google") {
        setIsGoogleLoading(true);
      } else {
        setIsAppleLoading(true);
      }

      const auth = getFirebaseAuth();
      const authProvider =
        provider === "google"
          ? new GoogleAuthProvider()
          : new OAuthProvider("apple.com");
      if (provider === "google") {
        (authProvider as GoogleAuthProvider).setCustomParameters({
          prompt: "select_account",
        });
      }
      const result = await signInWithPopup(auth, authProvider);
      const firebaseIdToken = await result.user.getIdToken();
      const response = await loginWithFirebase(firebaseIdToken);
      handleAuthResponse(response);
    } catch (err) {
      console.error(err);
      setIsError(true);
      const fallback =
        provider === "google"
          ? "Google login failed. Please try again."
          : "Apple login failed. Please try again.";
      setAuthErrorMessage(
        process.env.NODE_ENV === "development" ? loginErrorDetail(err) : fallback,
      );
    } finally {
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  const verifyTotpAndLogin = async () => {
    if (!mfaToken || isTotpVerifying) return;
    setIsError(false);
    setAuthErrorMessage("");

    const normalizedCode = totpCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setIsError(true);
      setAuthErrorMessage("Enter a valid 6-digit code.");
      return;
    }

    try {
      setIsTotpVerifying(true);
      const response = await verifyAdminLoginTotp(mfaToken, normalizedCode);
      if (response.status === 200 && response.data?.jwt) {
        completeLogin(response.data.jwt);
        return;
      }
      setIsError(true);
      setAuthErrorMessage("Failed to verify code.");
    } catch (err) {
      void err;
      setIsError(true);
      setAuthErrorMessage("Invalid or expired code.");
    } finally {
      setIsTotpVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.main}>
      <form className={styles.loginModal} onSubmit={handleSubmit}>
        <img src={logo.src} alt="" width={103} height={39} />
        {!mfaToken && (
          <>
            <Input
              value={email}
              setValue={setEmail}
              label="Email"
              isPassword={false}
              isError={isError}
              setIsError={setIsError}
            />
            <Input
              value={password}
              setValue={setPassword}
              label="Password"
              isPassword={true}
              isError={isError}
              setIsError={setIsError}
            />
          </>
        )}
        {mfaToken && (
          <>
            <p className={styles.mfaHint}>
              Enter the 6-digit code from Google Authenticator.
            </p>
            <Input
              value={totpCode}
              setValue={setTotpCode}
              label="Authenticator code"
              isPassword={false}
              isError={isError}
              setIsError={setIsError}
            />
          </>
        )}
        {isError && <p className={styles.error}>{authErrorMessage}</p>}
        {!mfaToken && (
          <Button
            title="Login"
            type="BLACK"
            htmlType="submit"
            height={48}
            className="w-full"
            isDisabled={isLoading}
            isLoading={isLoading}
          />
        )}
        {!mfaToken && <div className={styles.divider}>or continue with</div>}
        {!mfaToken && (
          <div className={styles.oauthButtons}>
            <Button
              title={isGoogleLoading ? "Google..." : "Google"}
              type="OUTLINED"
              height={44}
              imgUrl={googleLogo.src}
              isDisabled={isGoogleLoading || isAppleLoading || isLoading}
              onClick={() => completeFirebaseLogin("google")}
            />
            <Button
              title={isAppleLoading ? "Apple..." : "Apple"}
              type="OUTLINED"
              height={44}
              imgUrl={appleLogo.src}
              isDisabled={isGoogleLoading || isAppleLoading || isLoading}
              onClick={() => completeFirebaseLogin("apple")}
            />
          </div>
        )}
        {mfaToken && (
          <>
          <div className={styles.oauthButtons}>
            <Button
              title={isTotpVerifying ? "Verifying..." : "Verify code"}
              type="BLACK"
              height={44}
              isDisabled={isTotpVerifying}
              isLoading={isTotpVerifying}
              onClick={verifyTotpAndLogin}
            />
            <Button
              title="Back"
              type="OUTLINED"
              height={44}
              isDisabled={isTotpVerifying}
              onClick={() => {
                setMfaToken(null);
                setTotpCode("");
                setIsError(false);
                setAuthErrorMessage("");
              }}
            />
          </div>
          </>
        )}
      </form>
    </div>
  );
};

export default MainPage;
