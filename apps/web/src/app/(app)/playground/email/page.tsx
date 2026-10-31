"use client";

import dynamic from "next/dynamic";
import { env } from "../../../../lib/env";

const Bench = env.emailApiEnabled ? dynamic(() => import("./bench")) : null;

export default function EmailPlaygroundPage() {
  if (!Bench) {
    return (
      <main>
        <h1>Email playground</h1>
        <p>The email API is closed.</p>
      </main>
    );
  }
  return <Bench />;
}
