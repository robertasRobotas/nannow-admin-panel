import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="icon"
          href="/site-icon.svg?v=2"
          sizes="any"
          type="image/svg+xml"
        />
        <link rel="shortcut icon" href="/site-icon.svg?v=2" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/site-icon.svg?v=2" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
