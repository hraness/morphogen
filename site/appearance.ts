import { attachHeroLight, installAppearanceMenus } from "@hraness/design-kit/browser";

installAppearanceMenus({ lightThemeColor: "#e1e2e7", darkThemeColor: "#1a1b26", storageKey: "morphogen-appearance" });
const enhanceHeroes = () => document.querySelectorAll<HTMLElement>("[data-hraness-hero]").forEach(attachHeroLight);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceHeroes, { once: true });
else enhanceHeroes();
