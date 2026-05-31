import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { getAllPosts } from "@/content/posts";

const BASE = "https://fridgespy.com";

export const Route = createFileRoute("/blog")({
  head: () => {
    const posts = getAllPosts();
    return {
      meta: [
        { title: "FridgeSpy Blog — Food Waste, Kitchen Tips & AI Cooking" },
        {
          name: "description",
          content:
            "Practical guides on cutting food waste, smart kitchen inventory, AI receipt scanning, meal prep and cooking from what you already have.",
        },
        { property: "og:title", content: "FridgeSpy Blog" },
        {
          property: "og:description",
          content:
            "Practical guides on food waste, kitchen inventory, AI receipt scanning and cooking from what you have.",
        },
        { property: "og:url", content: `${BASE}/blog` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${BASE}/blog` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "FridgeSpy Blog",
            url: `${BASE}/blog`,
            description:
              "Guides on food waste, kitchen inventory, AI receipt scanning, and cooking from what you have.",
            publisher: {
              "@type": "Organization",
              name: "FridgeSpy",
              logo: { "@type": "ImageObject", url: `${BASE}/icon-512.png` },
            },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              description: p.description,
              datePublished: p.publishedAt,
              dateModified: p.updatedAt ?? p.publishedAt,
              author: { "@type": "Organization", name: p.author },
              url: `${BASE}/blog/${p.slug}`,
            })),
          }),
        },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const posts = getAllPosts();
  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <article className="mx-auto max-w-2xl">
        <header className="text-center">
          <span className="inline-block rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Blog
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Eat better. Waste less. Cook from what you have.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Practical, no-nonsense guides from the FridgeSpy team.
          </p>
        </header>

        <ul className="mt-10 space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="block rounded-2xl border border-border bg-card/50 p-5 transition hover:border-primary/40 hover:bg-card"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <time dateTime={p.publishedAt}>
                    {new Date(p.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden>·</span>
                  <span>{p.readingMinutes} min read</span>
                </div>
                <h2 className="mt-2 text-lg font-bold leading-snug text-foreground">
                  {p.title}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>

        <PublicFooter />
      </article>
    </div>
  );
}
