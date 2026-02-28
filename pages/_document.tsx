import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="icon"
          href="/nannow-icon-black-64x64.svg"
          sizes="any"
          type="image/svg+xml"
        />
        <link
          rel="shortcut icon"
          href="/nannow-icon-black-64x64.svg"
          type="image/svg+xml"
        />
        <link rel="apple-touch-icon" href="/nannow-icon-black-64x64.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
