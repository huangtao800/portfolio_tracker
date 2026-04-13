"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type State = "idle" | "uploading" | "done" | "error";

export default function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setState("uploading");
    setMessage("");

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      setMessage(`Uploading ${i + 1}/${files.length}…`);
      const formData = new FormData();
      formData.append("file", files[i]);

      try {
        const res = await fetch("/api/upload-csv", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) {
          failed++;
          console.error(`Failed to upload ${files[i].name}:`, json.error);
        } else {
          succeeded++;
        }
      } catch {
        failed++;
      }
    }

    if (inputRef.current) inputRef.current.value = "";

    if (failed === 0) {
      setMessage(files.length === 1 ? "Uploaded" : `${succeeded} files uploaded`);
      setState("done");
      router.refresh();
    } else if (succeeded === 0) {
      setMessage("Upload failed");
      setState("error");
    } else {
      setMessage(`${succeeded}/${files.length} uploaded`);
      setState("error");
      router.refresh();
    }

    setTimeout(() => { setState("idle"); setMessage(""); }, 4000);
  };

  const color =
    state === "error"     ? "text-red-400"
    : state === "done"    ? "text-green-400"
    : "text-gray-400 hover:text-gray-200";

  const label =
    state === "uploading" ? message || "Uploading…"
    : state === "done"    ? message || "Uploaded"
    : state === "error"   ? message || "Failed"
    : "Upload";

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={state === "uploading"}
        title="Upload CSV"
        className={`flex items-center gap-1.5 text-sm transition-colors ${color} disabled:cursor-not-allowed`}
      >
        {state === "uploading" ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="w-4 h-4 animate-spin">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.389Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="w-4 h-4">
            <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
        )}
        <span>{state === "uploading" ? label : state === "idle" ? "Upload" : label}</span>
      </button>
    </div>
  );
}
