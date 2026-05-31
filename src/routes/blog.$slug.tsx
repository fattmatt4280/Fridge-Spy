import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { getPostBySlug, getAllPosts } from "@/content/posts";

const BASE = "https://fridgespy.com";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Post not found — FridgeSpy Blog" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const url = `${BASE}/blog/${params.slug}`;
    return {
      meta: [
        { title: `${loaderData.title} — FridgeSpy Blog` },
        { name: "description", content: loaderData.description },
        { name: "author", content: loaderData.author },
        { name: "keywords", content: loaderData.tags.join(", ") },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: loaderData.publishedAt },
        ...(loaderData.updatedAt
          ? [{ property: "article:modified_time", content: loaderData.updatedAt }]
          : []),
        { property: "article:author", content: loaderData.author },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.title },
        { name: "twitter:description", content: loaderData.description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: loaderData.title,
            description: loaderData.description,
            datePublished: loaderData.publishedAt,
            dateModified: loaderData.updatedAt ?? loaderData.publishedAt,
            author: { "@type": "Organization", name: loaderData.author },
            publisher: {
              "@type": "Organization",
              name: "FridgeSpy",
              logo: { "@type": "ImageObject", url: `${BASE}/icon-512.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            keywords: loaderData.tags.join(", "),
            url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: BASE },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen px-5 py-16 text-center">
      <h1 className="text-2xl font-bold">Post not found</h1>
      <Link to="/blog" className="mt-4 inline-block text-primary underline">
        ← Back to the blog
      </Link>
    </div>
  ),
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();
  const related = getAllPosts().filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen px-5 pb-8 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <article className="mx-auto max-w-2xl">
        <nav className="mb-6 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span aria-hidden> / </span>
          <Link to="/blog" className="hover:text-foreground">Blog</Link>
        </nav>

        <header>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{post.description}</p>
        </header>

        <div
          className="prose prose-invert mt-8 max-w-none text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:my-1 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t: string) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
            >
              #{t}
            </span>
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-bold">Keep reading</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: r.slug }}
                    className="block rounded-xl border border-border bg-card/50 p-4 hover:border-primary/40"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PublicFooter />
      </article>
    </div>
  );
}
