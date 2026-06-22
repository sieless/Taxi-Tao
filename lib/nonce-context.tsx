"use client";

import { createContext, useContext, ReactNode } from "react";

const NonceContext = createContext("");

export function useNonce(): string {
  return useContext(NonceContext);
}

export default function NonceProvider({
  nonce,
  children,
}: {
  nonce: string;
  children: ReactNode;
}) {
  return (
    <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
  );
}
