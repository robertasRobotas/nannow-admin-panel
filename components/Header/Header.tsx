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
  const [hasNotEndedOrders, setHasNotEndedOrders] = useState(false);
  const [hasNotPaidOrders, setHasNotPaidOrders] = useState(false);
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
        setHasNotEndedOrders(Number(count) > 0);
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
        setHasNotPaidOrders(Number(count) > 0);
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
                    isAttention={
                      l.link === "/orders" &&
                      (hasNotEndedOrders || hasNotPaidOrders)
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
          hasNotEndedOrders={hasNotEndedOrders}
        />
      )}
    </>
  );
};

export default Header;
