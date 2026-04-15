"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type State = "idle" | "syncing" | "done" | "error";

export default function SyncButton() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  const handleSync = async () => {
    setState("syncing");
    setMessage("");

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setMessage(json.error ?? "Sync failed");
        setState("error");
      } else {
        const fallbackCount = json.fallback?.length ?? 0;
        setMessage(
          fallbackCount > 0
            ? `Synced (${fallbackCount} ticker${fallbackCount > 1 ? "s" : ""} used cached price)`
            : "Synced"
        );
        setState("done");
        router.refresh();
      }
    } catch {
      setMessage("Sync failed");
      setState("error");
    }

    setTimeout(() => { setState("idle"); setMessage(""); }, 5000);
  };

  const color =
    state === "error"   ? "text-red-400"
    : state === "done"  ? "text-green-400"
    : "text-gray-400 hover:text-gray-200";

  const label =
    state === "syncing" ? "Syncing…"
    : state === "done"  ? message || "Synced"
    : state === "error" ? message || "Sync failed"
    : "Sync";

  return (
    <button
      onClick={handleSync}
      disabled={state === "syncing"}
      title="Sync latest prices from Yahoo Finance"
      className={`flex items-center gap-1.5 text-sm transition-colors ${color} disabled:cursor-not-allowed`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 ${state === "syncing" ? "animate-spin" : ""}`}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
