// The 404 page: the shared design-kit status page inside the homepage's
// header and footer. Vercel serves site/dist/404.html with status 404 for any
// address the build did not emit.

import { renderStatusPageHtml, type StatusPageLink } from "@hraness/design-kit";

const REPO = "https://github.com/hraness/morphogen";

/** Pages listed in the sitemap, offered as "Did you mean" for a mistyped address. */
export function sitemapRoutes(sitemap: string): StatusPageLink[] {
  return [...sitemap.matchAll(/<loc>https:\/\/morphogen\.dev(\/[^<]*)<\/loc>/g)]
    .map((match) => ({ href: match[1]!, label: match[1] === "/" ? "morphogen" : match[1]! }));
}

/** Replace the homepage's metadata and main content with the status page. */
export function renderNotFoundDocument(homepage: string, footer: string, routes: readonly StatusPageLink[]): string {
  const cut = (marker: string): number => {
    const index = homepage.indexOf(marker);
    if (index === -1 || homepage.indexOf(marker, index + 1) !== -1) throw new Error(`Expected exactly one ${marker} in index.html`);
    return index;
  };
  const head = homepage.slice(0, cut('<meta name="description"'))
    .replace(/<title>[^<]*<\/title>/, "<title>Page not found · morphogen</title>");
  const assets = homepage.slice(cut('<script src="/appearance.js">'), cut("</head>"))
    .replace('<link rel="stylesheet" href="/footer.css">', '<link rel="stylesheet" href="/design/status-page.css">\n<link rel="stylesheet" href="/footer.css">');
  const header = homepage.slice(cut("</head>"), cut('<main id="main"'));
  const page = renderStatusPageHtml({
    siteName: "morphogen",
    rootElement: "div",
    // Same action as the homepage hero.
    primaryAction: { href: REPO, label: "Explore the source" },
    next: [
      { href: "/", label: "How morphogen works", description: "A typed graph where code does most of the work and agent cells decide the rest." },
      { href: `${REPO}/tree/main/docs`, label: "Read the docs", description: "Design notes on executors, habitats, and using morphogen as an agent tool." },
      { href: `${REPO}/blob/main/spec/v1/organism.md`, label: "The organism contract", description: "The v1 rules for manifests, cells, budgets, and replayable receipts." },
    ],
    routes,
    agentIndexHref: "/llms.txt",
  });
  return [
    head,
    '<meta name="robots" content="noindex">\n',
    assets,
    '<script src="/status.js" defer></script>\n',
    header,
    `<main id="main" tabindex="-1">${page}</main>\n\n`,
    footer,
    "\n</body>\n</html>\n",
  ].join("");
}
