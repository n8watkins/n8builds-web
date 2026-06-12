"use client";

import NextError from "next/error";

export default function GlobalError({ error: _ }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
