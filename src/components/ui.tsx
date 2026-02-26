import React from "react";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 p-4 shadow-lg">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-white/70">{label}</div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const { variant = "primary", className = "", ...rest } = props;
  const base = "rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-60";
  const v =
    variant === "primary" ? "bg-white text-black hover:bg-white/90" :
    variant === "danger" ? "bg-red-500/90 text-white hover:bg-red-500" :
    "bg-transparent text-white/80 hover:bg-white/5 hover:text-white";

  return <button className={`${base} ${v} ${className}`} {...rest} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none",
        "placeholder:text-white/30 focus:border-white/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none",
        "focus:border-white/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none",
        "placeholder:text-white/30 focus:border-white/20",
        props.className ?? ""
      ].join(" ")}
    />
  );
}
