import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { inter } from "@/helpers/fonts";
import { ToastContainer } from "react-toastify";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={inter.className}>
      <Head>
        <title>Nannow admin</title>
      </Head>
      <Component {...pageProps} />
      <ToastContainer position="bottom-right" />
    </main>
  );
}
