import styles from "./header.module.css";
import logoImg from "../../assets/images/logo-admin.svg";
import Link from "next/link";
import HeaderButton from "../HeaderButton/HeaderButton";
import Button from "../Button/Button";
import burgerBtn from "../../assets/images/burger-btn.svg";
import { links } from "@/data/headerLinks";
import { useState } from "react";
import HeaderMenu from "./HeaderMenu/HeaderMenu";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

const Header = () => {
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);
  const { pathname } = useRouter();

  const router = useRouter();

  return (
    <>
      <div className={styles.main}>
        <button
          onClick={() => setMenuDisplayed(true)}
          className={styles.burgerBtn}
        >
          <img src={burgerBtn.src} alt="Burger button" />
        </button>
        <img className={styles.logoImg} src={logoImg.src} alt="Logo" />
        <nav className={styles.nav}>
          <ul>
            {links.map((l) => (
              <li key={l.link}>
                <Link href={l.link}>
                  <HeaderButton
                    title={l.title}
                    isActive={`/${pathname.split("/")[1]}` === l.link}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.logOutBtn}>
          <Button
            onClick={() => {
              Cookies.remove("@user_jwt");
              router.push("/login");
            }}
            title="Logout"
            type="OUTLINED"
          />
        </div>
      </div>
      {isMenuDisplayed && (
        <HeaderMenu links={links} onClose={() => setMenuDisplayed(false)} />
      )}
    </>
  );
};

export default Header;
