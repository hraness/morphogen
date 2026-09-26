import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { renderNotFoundDocument, sitemapRoutes } from "./not-found";

const SITE = import.meta.dir;

describe("404 page", async () => {
  const homepage = await readFile(join(SITE, "index.html"), "utf8");
  const routes = sitemapRoutes(await readFile(join(SITE, "sitemap.xml"), "utf8"));
  const page = renderNotFoundDocument(homepage, "<footer>shared footer</footer>", routes);

  test("reads known pages from the sitemap", () => {
    expect(routes).toContainEqual({ href: "/", label: "morphogen" });
  });

  test("shows the shared status page inside the site header and footer", () => {
    expect(page).toContain('<header class="site-header">');
    expect(page).toContain('<main id="main" tabindex="-1"><div class="hraness-status-page"');
    expect(page).toContain('href="https://github.com/hraness/morphogen">Explore the source</a>');
    expect(page).toContain("<footer>shared footer</footer>");
    expect(page).toContain('<script src="/status.js" defer></script>');
    expect(page).toContain('<link rel="stylesheet" href="/design/status-page.css">');
  });

  test("stays out of search indexes and loads assets from the site root", () => {
    expect(page).toContain('<meta name="robots" content="noindex">');
    expect(page).not.toContain('rel="canonical"');
    expect(page).not.toContain("index, follow");
    expect(page).not.toMatch(/(?:href|src)="(?!\/|https:|#)[^"]/);
  });
});
