"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

export default function TestPage() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Could not connect to backend"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">StudyAI</h1>
      <p className="mt-4">{message}</p>
    </main>
  );
}
