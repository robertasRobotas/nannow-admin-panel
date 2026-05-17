import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { inter } from "@/helpers/fonts";
import { ToastContainer } from "react-toastify";
import Head from "next/head";
import { AdminSocketProvider } from "@/components/AdminSocket/AdminSocketProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

if (process.env.NODE_ENV !== "production") {
  console.log("Nannow admin test deployment log");
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppErrorBoundary>
      <main className={inter.className}>
        <Head>
          <title>Nannow admin</title>
        </Head>
        <AdminSocketProvider>
          <Component {...pageProps} />
        </AdminSocketProvider>
        <ToastContainer position="bottom-right" />
      </main>
    </AppErrorBoundary>
  );
}
