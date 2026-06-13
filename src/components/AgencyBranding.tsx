"use client";
import { useEffect } from "react";

type Agency = {
  primaryColor: string;
  secondaryColor: string;
};

export default function AgencyBranding({ agency }: { agency: Agency }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand", agency.primaryColor);
    root.style.setProperty("--brand-dark", darken(agency.primaryColor, 15));
    root.style.setProperty("--brand-light", lighten(agency.primaryColor, 92));
    root.style.setProperty("--sidebar-bg", agency.secondaryColor);
  }, [agency.primaryColor, agency.secondaryColor]);

  return null;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0)
      : max === g ? (b - r) / d + 2
      : (r - g) / d + 4;
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

function lighten(hex: string, lightness: number): string {
  const [h, s] = hexToHsl(hex);
  return hslToHex(h, Math.max(10, s - 30), lightness);
}
