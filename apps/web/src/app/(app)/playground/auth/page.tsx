"use client";

import { useState } from "react";
import {
  useLogout,
  useSession,
  useSigninCredentials,
  useSignupCredentials,
} from "../../../../queries/auth";

export default function AuthPlaygroundPage() {
  const [name, setName] = useState("IndieFast User");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");

  const signup = useSignupCredentials();
  const signin = useSigninCredentials();
  const logout = useLogout();
  const session = useSession();

  return (
    <main>
      <h1>Auth playground</h1>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
        />
      </label>
      <label>
        Password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
        />
      </label>
      <div>
        <button
          onClick={() => signup.mutate({ name, email, password })}
          type="button"
        >
          Sign up
        </button>
        <button
          onClick={() => signin.mutate({ email, password })}
          type="button"
        >
          Sign in
        </button>
        <button onClick={() => logout.mutate()} type="button">
          Logout
        </button>
      </div>
      <pre>{JSON.stringify(session.data, null, 2)}</pre>
      {signup.error ? <p>{signup.error.message}</p> : null}
      {signin.error ? <p>{signin.error.message}</p> : null}
      {logout.error ? <p>{logout.error.message}</p> : null}
    </main>
  );
}
