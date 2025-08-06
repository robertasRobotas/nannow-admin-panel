import { HeaderLink } from "@/types/HeaderLink";
import styles from "./headerMenu.module.css";
import crossImg from "../../../assets/images/cross.svg";
import logoImg from "../../../assets/images/logo-admin.svg";
import { useState } from "react";
import Link from "next/link";
import HeaderButton from "@/components/HeaderButton/HeaderButton";
import Button from "@/components/Button/Button";

type HeaderMenuProps = {
  links: HeaderLink[];
  onClose: () => void;
};

const HeaderMenu = ({ links, onClose }: HeaderMenuProps) => {
  const [isClosing, setClosing] = useState(false);
  return (
    <div
      className={`${styles.main} ${styles.slideInRight} ${
        isClosing && styles.slideOutLeft
      }`}
    >
      <div className={styles.logo}>
        <button
          onClick={() => {
            setClosing(true);
            setTimeout(() => onClose(), 500);
          }}
          className={styles.closeBtn}
        >
          <img src={crossImg.src} alt="Close" />
        </button>
        <img className={styles.logoImg} src={logoImg.src} alt="Logo" />
      </div>
      <nav className={styles.nav}>
        <ul>
          {links.map((l) => (
            <li key={l.link}>
              <Link href={l.link}>
                <HeaderButton title={l.title} justify="JUSTIFY-START" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.logOutBtn}>
        <Button
          onClick={() => console.log("wip")}
          title="Logout"
          type="OUTLINED"
          isDisabled={false}
        />
      </div>
    </div>
  );
};

export default HeaderMenu;
