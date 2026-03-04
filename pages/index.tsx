import styles from "../styles/Home.module.css";
import logo from "../assets/images/logo-admin.svg";
import Input from "@/components/Input/Input";
import { useState } from "react";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";
import { login, loginWithFirebase } from "./api/fetch";
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

  const router = useRouter();

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

      if (response.status === 200) {
        Cookies.set("@user_jwt", response.data.jwt);
        setTimeout(() => {
          router.push("/users");
        }, 500);
        return;
      }
    } catch (err) {
      setIsError(true);
      setAuthErrorMessage("Your email or password is wrong");
      void err;
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

      if (response.status === 200) {
        Cookies.set("@user_jwt", response.data.jwt);
        setTimeout(() => {
          router.push("/users");
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setAuthErrorMessage(
        provider === "google"
          ? "Google login failed. Please try again."
          : "Apple login failed. Please try again.",
      );
    } finally {
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.main}>
      <form className={styles.loginModal} onSubmit={handleSubmit}>
        <img src={logo.src} />
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
        {isError && <p className={styles.error}>{authErrorMessage}</p>}
        <Button
          title="Login"
          type="BLACK"
          height={48}
          isDisabled={isLoading}
          isLoading={isLoading}
          onClick={onSubmit}
        />
        <div className={styles.divider}>or continue with</div>
        <div className={styles.oauthButtons}>
          <Button
            title={isGoogleLoading ? "Google..." : "Google"}
            type="OUTLINED"
            height={44}
            isDisabled={isGoogleLoading || isAppleLoading || isLoading}
            onClick={() => completeFirebaseLogin("google")}
          />
          <Button
            title={isAppleLoading ? "Apple..." : "Apple"}
            type="OUTLINED"
            height={44}
            isDisabled={isGoogleLoading || isAppleLoading || isLoading}
            onClick={() => completeFirebaseLogin("apple")}
          />
        </div>
      </form>
    </div>
  );
};

export default MainPage;
