import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="text-5xl font-extrabold">404</h1>
        <p className="mt-2 text-muted-foreground">This shelf is empty.</p>
        <a href="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0d1117" },
      { title: "FridgeSpy — Know what's in your kitchen. Always." },
      { name: "description", content: "Track every item in your kitchen with AI receipt and fridge scanning. Stop wasting food, cook from what you have." },
      { property: "og:title", content: "FridgeSpy — Know what's in your kitchen. Always." },
      { property: "og:description", content: "Track every item in your kitchen with AI receipt and fridge scanning. Stop wasting food, cook from what you have." },
      { name: "twitter:title", content: "FridgeSpy — Know what's in your kitchen. Always." },
      { name: "twitter:description", content: "Track every item in your kitchen with AI receipt and fridge scanning. Stop wasting food, cook from what you have." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d04e5428-0fe8-4e55-ba78-66641cad20ba/id-preview-46a71ece--c293ce98-5e15-4790-97c7-a0c026491798.lovable.app-1779748192280.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d04e5428-0fe8-4e55-ba78-66641cad20ba/id-preview-46a71ece--c293ce98-5e15-4790-97c7-a0c026491798.lovable.app-1779748192280.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        theme="dark"
        position="bottom-center"
        offset={96}
        duration={2500}
        toastOptions={{
          style: {
            background: "#1c2333",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            borderLeft: "3px solid var(--color-primary)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
