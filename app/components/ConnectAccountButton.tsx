"use client";

import { useState, useCallback } from "react";
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from "react-plaid-link";

export default function ConnectAccountButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
      const data = await res.json();
      setLinkToken(data.linkToken);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSuccess = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");
    await fetch("/api/plaid/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicToken,
        institutionId:   metadata.institution?.institution_id,
        institutionName: metadata.institution?.name,
      }),
    });
    window.location.reload();
  }, []);

  const onExit = useCallback(() => {
    setLinkToken(null);
    setTimeout(() => {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
    }, 0);
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  const handleClick = useCallback(async () => {
    if (!linkToken) {
      await fetchLinkToken();
    } else {
      open();
    }
  }, [linkToken, fetchLinkToken, open]);

  // Auto-open Plaid Link once token is ready
  if (linkToken && ready) {
    open();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
    >
      {loading ? "Loading..." : "Connect Account"}
    </button>
  );
}
