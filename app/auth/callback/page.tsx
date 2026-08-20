"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase-browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState(supabase ? "Signing you in…" : "Supabase has not been configured for this site yet.");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;
    const finish = async () => {
      const code = new URL(window.location.href).searchParams.get("code");
      const result = code
        ? await client.auth.exchangeCodeForSession(code)
        : await client.auth.getSession();
      if (!active) return;
      if (result.error || !result.data.session) {
        setMessage("We could not complete this sign-in. Please return to CreatorHub and try again.");
        return;
      }
      window.location.replace("/");
    };

    void finish();
    return () => { active = false; };
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", color: "#171526" }}><p>{message}</p></main>;
}
