"use client";

import React from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:ring-2 focus:ring-[#E8610A]/30 focus:border-[#E8610A] outline-none ${props.className ?? ""}`}
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:ring-2 focus:ring-[#E8610A]/30 focus:border-[#E8610A] outline-none ${props.className ?? ""}`}
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:ring-2 focus:ring-[#E8610A]/30 focus:border-[#E8610A] outline-none resize-none ${props.className ?? ""}`}
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-[#E8610A] hover:bg-[#c94f08] text-white",
    secondary: "border hover:opacity-80 text-sm",
    ghost: "hover:opacity-70 text-sm",
    danger: "border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${variants[variant]} ${props.className ?? ""}`}
      style={
        variant === "secondary"
          ? { borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }
          : undefined
      }
    >
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "#E8610A" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
      {children}
    </h2>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
