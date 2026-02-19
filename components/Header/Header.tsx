import styles from "./header.module.css";
import logoImg from "../../assets/images/logo-admin.svg";
import Link from "next/link";
import HeaderButton from "../HeaderButton/HeaderButton";
import Button from "../Button/Button";
import burgerBtn from "../../assets/images/burger-btn.svg";
import { links } from "@/data/headerLinks";
import { useEffect, useState } from "react";
import HeaderMenu from "./HeaderMenu/HeaderMenu";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  getNotEndedOrdersCount,
  getNotPaidOrdersCount,
} from "@/pages/api/fetch";
import axios from "axios";

const Header = () => {
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);
  const [notEndedOrdersCount, setNotEndedOrdersCount] = useState(0);
  const [notPaidOrdersCount, setNotPaidOrdersCount] = useState(0);
  const { pathname } = useRouter();

  const router = useRouter();

  useEffect(() => {
    const fetchNotEndedOrdersCount = async () => {
      try {
        const response = await getNotEndedOrdersCount();

        const count =
          response.data?.result?.count ??
          response.data?.count ??
          response.data?.result ??
          0;
        setNotEndedOrdersCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    };
    const fetchNotPaidOrdersCount = async () => {
      try {
        const response = await getNotPaidOrdersCount();

        const count =
          response.data?.result?.count ??
          response.data?.count ??
          response.data?.result ??
          0;
        setNotPaidOrdersCount(Number(count) || 0);
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          if (err.status === 401) {
            router.push("/");
          }
        }
      }
    };

    fetchNotEndedOrdersCount();
    fetchNotPaidOrdersCount();
  }, [router]);

  const ordersAttentionNumber = notEndedOrdersCount + notPaidOrdersCount;

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
                    attentionNumber={
                      l.link === "/orders" && ordersAttentionNumber > 0
                        ? ordersAttentionNumber
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
            onClick={() => {
              Cookies.remove("@user_jwt");
              router.push("/");
            }}
            title="Logout"
            type="OUTLINED"
          />
        </div>
      </div>
      {isMenuDisplayed && (
        <HeaderMenu
          links={links}
          onClose={() => setMenuDisplayed(false)}
          ordersAttentionNumber={ordersAttentionNumber}
        />
      )}
    </>
  );
};

export default Header;
