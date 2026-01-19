import styles from "../styles/Home.module.css";
import logo from "../assets/images/logo-admin.svg";
import Input from "@/components/Input/Input";
import { useState } from "react";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";
import { login } from "./api/fetch";
import Cookies from "js-cookie";

const MainPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const onSubmit = async () => {
    if (isLoading) return;
    setIsError(false);
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
      void err;
    } finally {
      setIsLoading(false);
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
        {isError && (
          <p className={styles.error}>Your email or password is wrong</p>
        )}
        <Button
          title="Login"
          type="BLACK"
          height={48}
          isDisabled={isLoading}
          isLoading={isLoading}
          onClick={onSubmit}
        />
      </form>
    </div>
  );
};

export default MainPage;
