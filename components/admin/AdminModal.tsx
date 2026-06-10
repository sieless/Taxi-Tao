"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info";

export interface ModalConfig {
  mode: "alert" | "confirm" | "prompt";
  title?: string;
  message: string;
  type?: AlertType;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  options?: string[]; // Added for prompt mode (e.g. presets)
}

interface AdminModalProps extends ModalConfig {
  onResolve: (value: boolean | string | null | void) => void;
}

const ICON_MAP: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle className="text-primary-500" size={28} />,
  error: <XCircle className="text-red-500" size={28} />,
  warning: <AlertTriangle className="text-amber-500" size={28} />,
  info: <Info className="text-blue-500" size={28} />,
};

const BG_MAP: Record<AlertType, string> = {
  success: "bg-primary-50",
  error: "bg-red-50",
  warning: "bg-amber-50",
  info: "bg-blue-50",
};

const BTN_MAP: Record<AlertType, string> = {
  success: "bg-primary-600 hover:bg-primary-700",
  error: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  info: "bg-primary-600 hover:bg-primary-700",
};

export function AdminModal({
  mode,
  title,
  message,
  type = "info",
  placeholder = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  options = [],
  onResolve,
}: AdminModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onResolve(mode === "confirm" ? false : mode === "prompt" ? null : undefined);
      }
      if (e.key === "Enter" && mode === "alert") onResolve(undefined);
      if (e.key === "Enter" && mode === "confirm") onResolve(true);
      if (e.key === "Enter" && mode === "prompt") onResolve(inputValue.trim() || null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, inputValue, onResolve]);

  const handleConfirm = () => {
    if (mode === "alert") onResolve(undefined);
    else if (mode === "confirm") onResolve(true);
    else onResolve(inputValue.trim() || null);
  };

  const handleCancel = () => {
    onResolve(mode === "confirm" ? false : null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Backdrop click closes alert/confirm */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (mode !== "prompt") handleCancel();
        }}
      />

      <div className={`relative bg-white rounded-2xl shadow-2xl w-full p-6 animate-in zoom-in-95 duration-150 ${mode === "prompt" && options.length > 0 ? "max-w-lg" : "max-w-sm"}`}>
        {/* Close button for alerts */}
        {mode === "alert" && (
          <button
            onClick={() => onResolve(undefined)}
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        )}

        {/* Icon (alert only) */}
        {mode === "alert" && (
          <div className={`w-14 h-14 ${BG_MAP[type]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {ICON_MAP[type]}
          </div>
        )}

        {/* Title */}
        {title && (
          <h2 className={`text-lg font-bold text-gray-900 mb-2 ${mode === "alert" ? "text-center" : ""}`}>
            {title}
          </h2>
        )}

        {/* Message */}
        <p className={`text-gray-600 text-sm mb-5 ${mode === "alert" ? "text-center" : ""}`}>{message}</p>

        {/* Prompt input */}
        {mode === "prompt" && (
          <div className="space-y-4 mb-4">
            {options.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggested Reasons</p>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputValue(opt)}
                      className="text-left px-3 py-2 text-xs text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-100 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details / Custom Reason</p>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className={`flex gap-3 ${mode === "alert" ? "justify-center" : "justify-end"}`}>
          {mode !== "alert" && (
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition ${BTN_MAP[type]}`}
          >
            {mode === "confirm" ? confirmLabel : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
