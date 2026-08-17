"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabase-browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase has not been configured for this site yet.");
      return;
    }

    let active = true;
    const finish = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setMessage("We could not verify this sign-in link. Please request a new one.");
        return;
      }
      window.location.replace("/");
    };

    void finish();
    return () => { active = false; };
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Arial, sans-serif", color: "#171526" }}><p>{message}</p></main>;
}

