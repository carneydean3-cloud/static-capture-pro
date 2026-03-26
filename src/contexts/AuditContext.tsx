import { createContext, useContext, useState, ReactNode } from "react";
import type { AuditResult } from "@/types/audit";

type AuditStage =
  | "idle"
  | "capturing"
  | "analysing"
  | "generating"
  | "email_capture"
  | "done";

interface AuditContextType {
  stage: AuditStage;
  setStage: (s: AuditStage) => void;
  url: string;
  setUrl: (u: string) => void;
  userEmail: string;
  setUserEmail: (e: string) => void;
  result: AuditResult | null;
  setResult: (r: AuditResult | null) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export const useAudit = () => {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
};

export const AuditProvider = ({ children }: { children: ReactNode }) => {
  const [stage, setStage] = useState<AuditStage>("idle");
  const [url, setUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuditContext.Provider
      value={{
        stage,
        setStage,
        url,
        setUrl,
        userEmail,
        setUserEmail,
        result,
        setResult,
        error,
        setError,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};
