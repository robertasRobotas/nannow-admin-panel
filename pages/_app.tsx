import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { inter } from "@/helpers/fonts";
import { ToastContainer } from "react-toastify";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={inter.className}>
      <Component {...pageProps} />
      <ToastContainer position="bottom-right" />
    </main>
  );
}
