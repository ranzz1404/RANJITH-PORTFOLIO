import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { ContinuousBackground } from "@/components/portfolio/ContinuousBackground";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="hud-label">ERROR // 404</p>
        <h1 className="mt-2 text-6xl font-bold text-foreground">Not Found</h1>
        <Link to="/" className="mt-6 inline-block border border-accent px-6 py-2 text-accent hover:bg-accent hover:text-accent-foreground transition">
          Return Home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="hud-label text-accent">SYSTEM ERROR</p>
        <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
        <button onClick={reset} className="mt-6 border border-accent px-6 py-2 text-accent hover:bg-accent hover:text-accent-foreground transition">
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ranjith Kumar K — Mechanical Engineer Portfolio" },
      { name: "description", content: "Portfolio of Ranjith Kumar K, B.E. Mechanical Engineering student and aspiring Design Engineer from Theni, Tamil Nadu." },
      { property: "og:title", content: "Ranjith Kumar K — Mechanical Engineer Portfolio" },
      { property: "og:description", content: "Portfolio of Ranjith Kumar K, B.E. Mechanical Engineering student and aspiring Design Engineer from Theni, Tamil Nadu." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Ranjith Kumar K — Mechanical Engineer Portfolio" },
      { name: "twitter:description", content: "Portfolio of Ranjith Kumar K, B.E. Mechanical Engineering student and aspiring Design Engineer from Theni, Tamil Nadu." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e42e4702-83bc-461c-8bfa-b2def9bd63c9/id-preview-8ae0faf9--9000ece6-b32e-41b6-84b4-c4da5bdbd188.lovable.app-1782358830795.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e42e4702-83bc-461c-8bfa-b2def9bd63c9/id-preview-8ae0faf9--9000ece6-b32e-41b6-84b4-c4da5bdbd188.lovable.app-1782358830795.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ContinuousBackground />
      <Outlet />
      <Toaster theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
