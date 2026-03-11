import { HeaderLink } from "@/types/HeaderLink";
import styles from "./headerMenu.module.css";
import crossImg from "../../../assets/images/cross.svg";
import logoImg from "../../../assets/images/logo-admin.svg";
import { useState } from "react";
import Link from "next/link";
import HeaderButton from "@/components/HeaderButton/HeaderButton";
import Button from "@/components/Button/Button";
import { useRouter } from "next/router";

type HeaderMenuProps = {
  links: HeaderLink[];
  onClose: () => void;
  ordersAttentionNumber?: number;
  usersAttentionNumber?: number;
  criminalCheckAttentionNumber?: number;
  documentsAttentionNumber?: number;
  reportsAttentionNumber?: number;
};

const HeaderMenu = ({
  links,
  onClose,
  ordersAttentionNumber,
  usersAttentionNumber,
  criminalCheckAttentionNumber,
  documentsAttentionNumber,
  reportsAttentionNumber,
}: HeaderMenuProps) => {
  const [isClosing, setClosing] = useState(false);
  const { pathname } = useRouter();
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
                <HeaderButton
                  title={l.title}
                  isActive={pathname === l.link}
                  justify="JUSTIFY-START"
                  attentionNumber={
                    l.link === "/orders"
                      ? (ordersAttentionNumber ?? 0) > 0
                        ? ordersAttentionNumber
                        : undefined
                      : l.link === "/users" && (usersAttentionNumber ?? 0) > 0
                        ? usersAttentionNumber
                        : l.link === "/criminal-check" &&
                            (criminalCheckAttentionNumber ?? 0) > 0
                          ? criminalCheckAttentionNumber
                        : l.link === "/documents" &&
                            (documentsAttentionNumber ?? 0) > 0
                          ? documentsAttentionNumber
                        : l.link === "/reports" &&
                            (reportsAttentionNumber ?? 0) > 0
                          ? reportsAttentionNumber
                        : undefined
                  }
                />
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
