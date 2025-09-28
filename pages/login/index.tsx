import Template from "@/components/Template/Template";
import styles from "./loginPage.module.css";
import LoginForm from "@/components/LoginInForm/LoginInForm";

const LoginPage = () => {
  return (
    <Template>
      <div className={styles.main}>
        <h1 className={styles.title}>Log in</h1>
        <LoginForm />
      </div>
    </Template>
  );
};

export default LoginPage;
