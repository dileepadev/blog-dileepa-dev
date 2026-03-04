export const SITE_CONFIG = {
  siteName: "blog.dileepa.dev",
  siteUrl: "https://blog.dileepa.dev",
  defaultTitle: "Blog | Dileepa Bandara",
  defaultDescription:
    "Personal blog about software engineering, cloud computing, and AI.",
  defaultOgImage: "/images/banners/2026-01-30-welcome.png",
  twitterHandle: "@dileepadev",
  authorName: "Dileepa Bandara",
  authorUrl: "https://dileepa.dev",
  sourceRepositoryUrl: "https://github.com/dileepadev/blog-dileepa-dev",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;
