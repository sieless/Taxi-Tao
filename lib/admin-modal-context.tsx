"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AdminModal, ModalConfig, AlertType } from "@/components/admin/AdminModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModalContextValue {
  /**
   * Replaces window.alert().
   * @example await modal.showAlert("Payment verified", "success", "Done");
   */
  showAlert: (
    message: string,
    type?: AlertType,
    title?: string
  ) => Promise<void>;

  /**
   * Replaces window.confirm().  Returns true if the user confirmed.
   * @example if (!(await modal.showConfirm("Delete this driver?"))) return;
   */
  showConfirm: (
    message: string,
    title?: string,
    confirmLabel?: string
  ) => Promise<boolean>;

  /**
   * Replaces window.prompt(). Returns the trimmed string or null if cancelled.
   * @example const reason = await modal.showPrompt("Enter rejection reason:", "Placeholder", "Title", ["Option 1", "Option 2"]);
   */
  showPrompt: (
    message: string,
    placeholder?: string,
    title?: string,
    options?: string[]
  ) => Promise<string | null>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

type ActiveModal = ModalConfig & { resolve: (value: any) => void };

// ── Provider ──────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveModal | null>(null);

  const show = useCallback(
    (config: Omit<ModalConfig, "resolve">): Promise<any> =>
      new Promise((resolve) => {
        setActive({ ...config, resolve });
      }),
    []
  );

  const showAlert = useCallback(
    (message: string, type: AlertType = "info", title?: string): Promise<void> =>
      show({ mode: "alert", message, type, title }),
    [show]
  );

  const showConfirm = useCallback(
    (
      message: string,
      title?: string,
      confirmLabel = "Confirm"
    ): Promise<boolean> =>
      show({ mode: "confirm", message, title, confirmLabel }),
    [show]
  );

  const showPrompt = useCallback(
    (
      message: string,
      placeholder?: string,
      title?: string,
      options?: string[]
    ): Promise<string | null> =>
      show({ mode: "prompt", message, placeholder, title, options }),
    [show]
  );

  const handleResolve = useCallback(
    (value: any) => {
      active?.resolve(value);
      setActive(null);
    },
    [active]
  );

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {active && (
        <AdminModal
          mode={active.mode}
          title={active.title}
          message={active.message}
          type={active.type}
          placeholder={active.placeholder}
          confirmLabel={active.confirmLabel}
          cancelLabel={active.cancelLabel}
          options={active.options}
          onResolve={handleResolve}
        />
      )}
    </ModalContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useModal — access the admin modal API inside any component
 * that is a descendant of ModalProvider (i.e. inside /admin layout).
 */
export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx)
    throw new Error("useModal() must be used inside a <ModalProvider>.");
  return ctx;
}
