// Static site build: copy site sources into site/dist. No framework.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHranessSiteFooter } from "@hraness/site-footer";

import { renderNotFoundDocument, sitemapRoutes } from "./not-found";

const SITE = dirname(fileURLToPath(import.meta.url));
const DIST = join(SITE, "dist");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const f of ["styles.css", "robots.txt", "sitemap.xml", "llms.txt", "og.png"]) {
  await cp(join(SITE, f), join(DIST, f));
}
await cp(join(SITE, "icons"), join(DIST, "icons"), { recursive: true });

const html = await readFile(join(SITE, "index.html"), "utf8");
const marker = "<!-- hraness-site-footer -->";
if (html.split(marker).length !== 2) throw new Error("Expected exactly one shared footer slot");
const footer = renderHranessSiteFooter({ placement: "flow", mailingList: { kind: "none" } });
await writeFile(join(DIST, "index.html"), html.replace(marker, footer));
const routes = sitemapRoutes(await readFile(join(SITE, "sitemap.xml"), "utf8"));
await writeFile(join(DIST, "404.html"), renderNotFoundDocument(html, footer, routes));
const kit = dirname(fileURLToPath(import.meta.resolve("@hraness/design-kit/paper-theme.css")));
await mkdir(join(DIST, "design"), { recursive: true });
for (const name of ["paper-theme.css", "palette-system.css", "palette-bridge.css", "syntax-highlighting.css", "product-marketing.css", "product-marketing-preset.css", "lantern-material.css", "appearance-menu.css", "status-page.css", "fonts.css"]) {
  await cp(join(kit, name), join(DIST, "design", name));
}
for (const name of ["fonts", "marketing-assets"]) await cp(join(kit, name), join(DIST, "design", name), { recursive: true });
await cp(join(kit, "../LICENSE"), join(DIST, "design/LICENSE"));
await cp(fileURLToPath(import.meta.resolve("@hraness/site-footer/stylex.css")), join(DIST, "footer.css"));
const appearance = await Bun.build({ entrypoints: [join(SITE, "appearance.ts")], outdir: DIST, target: "browser", format: "iife", minify: true });
if (!appearance.success) throw new AggregateError(appearance.logs, "Appearance bundle failed");
const status = await Bun.build({ entrypoints: [join(SITE, "status.ts")], outdir: DIST, target: "browser", format: "iife", minify: true });
if (!status.success) throw new AggregateError(status.logs, "Status page bundle failed");

console.log(`site built → ${DIST}`);
