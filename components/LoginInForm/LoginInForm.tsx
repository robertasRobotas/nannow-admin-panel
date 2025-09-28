import { useState } from "react";
import styles from "./loginForm.module.css";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { login } from "@/pages/api/fetch";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setError] = useState(false);

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      const loginData = {
        email: email,
        password: password,
      };

      const response = await login(loginData);

      if (response.status === 200) {
        Cookies.set("@user_jwt", response.data.jwt);
        setTimeout(() => {
          router.push("/");
        }, 500);
        return;
      }
    } catch (err) {
      setError(true);
    }
  };

  return (
    <form className={styles.main} onSubmit={(e) => onSubmit(e)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {isError && (
        <p className={styles.error}>Your email or password is wrong</p>
      )}
    </form>
  );
};

export default LoginForm;
