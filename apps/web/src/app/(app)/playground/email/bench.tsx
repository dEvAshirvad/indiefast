"use client";

import { useState } from "react";
import { useSession } from "../../../../queries/auth";
import { useSendTestEmail } from "../../../../queries/email";

export default function EmailBench() {
  const session = useSession();
  const send = useSendTestEmail();
  const [to, setTo] = useState("user@example.com");

  if (!session.data) {
    return (
      <main>
        <h1>Email playground</h1>
        <p>
          Sign in on <a href="/playground/auth">/playground/auth</a> first.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Email playground</h1>
      <label>
        To
        <input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          type="email"
        />
      </label>
      <div>
        <button
          type="button"
          onClick={() => send.mutate({ to, template: "welcome" })}
        >
          Send welcome
        </button>
      </div>
      <pre>{JSON.stringify(send.data ?? null, null, 2)}</pre>
      {send.error ? <p>{send.error.message}</p> : null}
    </main>
  );
}
