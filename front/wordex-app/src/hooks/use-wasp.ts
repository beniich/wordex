"use client";

import { useState, useEffect } from "react";
import { WASPManager } from "@/lib/wasp/client";

/**
 * useWASP - High-level hook for managing end-to-end encryption.
 * Encapsulates WASM initialization and secure session lifecycle.
 */
export function useWASP() {
  const [wasp, setWasp] = useState<WASPManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);

  useEffect(() => {
    const initializeWASP = async () => {
      const manager = new WASPManager();
      try {
        await manager.initialize();
        setWasp(manager);
        setIsInitialized(true);
        // Generate a pseudo-random session identifier for visibility in UI
        setSessionLabel(`WASP_SEC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      } catch (err) {
        console.error("WASP: Critical Protocol Initialization Failure:", err);
      }
    };

    if (typeof window !== "undefined") {
      initializeWASP();
    }
  }, []);

  return { 
    wasp, 
    isInitialized, 
    sessionLabel,
    encryptionLevel: "Zero-Knowledge / High-Fidelity Signal-based"
  };
}
