import styles from "./header.module.css";
import logoImg from "../../assets/images/logo-admin.svg";
import Link from "next/link";
import HeaderButton from "./HeaderButton/HeaderButton";
import Button from "../Button/Button";

const Header = () => {
  return (
    <div className={styles.main}>
      <img className={styles.logoImg} src={logoImg.src} alt="Logo" />
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="#">
              <HeaderButton title="Users" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Orders" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Kids" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Payments" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Bugs" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Feedback" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Reported" isActive={false} />
            </Link>
          </li>
          <li>
            <Link className={styles.listItem} href="#">
              <HeaderButton title="Reviews" isActive={false} />
            </Link>
          </li>
        </ul>
      </nav>
      <Button title="Logout" type="OUTLINED" isDisabled={false} />
    </div>
  );
};

export default Header;
