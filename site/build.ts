// Static site build: copy site sources into site/dist. No framework.

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHranessSiteFooter } from "@hraness/site-footer";

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
await writeFile(join(DIST, "index.html"), html.replace(marker, renderHranessSiteFooter({ placement: "flow", mailingList: { kind: "none" } })));
const kit = dirname(fileURLToPath(import.meta.resolve("@hraness/design-kit/paper-theme.css")));
await mkdir(join(DIST, "design"), { recursive: true });
for (const name of ["paper-theme.css", "palette-system.css", "palette-bridge.css", "syntax-highlighting.css", "product-marketing.css", "product-marketing-preset.css", "lantern-material.css", "appearance-menu.css", "fonts.css"]) {
  await cp(join(kit, name), join(DIST, "design", name));
}
for (const name of ["fonts", "marketing-assets"]) await cp(join(kit, name), join(DIST, "design", name), { recursive: true });
await cp(join(kit, "../LICENSE"), join(DIST, "design/LICENSE"));
await cp(fileURLToPath(import.meta.resolve("@hraness/site-footer/stylex.css")), join(DIST, "footer.css"));
const appearance = await Bun.build({ entrypoints: [join(SITE, "appearance.ts")], outdir: DIST, target: "browser", format: "iife", minify: true });
if (!appearance.success) throw new AggregateError(appearance.logs, "Appearance bundle failed");

console.log(`site built → ${DIST}`);
