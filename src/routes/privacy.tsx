import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — FridgeSpy" },
      { name: "description", content: "How FridgeSpy collects, uses, and protects your personal data, including inventory photos, account details, and payment information." },
      { property: "og:title", content: "FridgeSpy Privacy Policy" },
      { property: "og:description", content: "How FridgeSpy collects, uses, and protects your personal data." },
      { property: "og:url", content: "https://fridgespy.com/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/privacy" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "FridgeSpy Privacy Policy",
        url: "https://fridgespy.com/privacy",
        datePublished: "2026-05-28",
        dateModified: "2026-05-28",
        publisher: { "@type": "Organization", name: "FridgeSpy", legalName: "Dream Holdings LLC" },
      }),
    }],
  }),
  component: PrivacyPage,
});

const LEGAL_NAME = "Dream Holdings LLC";
const CONTACT_EMAIL = "support@fridgespy.app";
const LAST_UPDATED = "May 28, 2026";

function PrivacyPage() {
  return (
    <div className="min-h-screen px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center gap-2 py-3">
        <Link to="/" className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Privacy Policy</h1>
      </header>

      <article className="prose-fs mx-auto max-w-2xl space-y-5 text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p>
          This Privacy Notice explains how <strong>{LEGAL_NAME}</strong> ("FridgeSpy", "we", "us") collects,
          uses, and shares personal data when you use the FridgeSpy application and related services
          (the "Service"). FridgeSpy is the data controller for the personal data described below.
        </p>

        <h2 className="text-base font-bold">1. Data we collect</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account data:</strong> email address, display name, password hash.</li>
          <li><strong>Inventory data:</strong> the grocery items, quantities, locations, expiry dates, photos, barcodes, and notes you add.</li>
          <li><strong>Usage data:</strong> activity log entries, recipe generations, scan counts, device/browser type, IP address (for security).</li>
          <li><strong>Payment data:</strong> handled entirely by our payment processor, Paddle. We receive only the subscription status, plan, and billing period — we never see your card number.</li>
          <li><strong>Photos you submit:</strong> receipt photos, fridge photos, and product label photos you choose to scan. These are sent to our AI provider (see Section 3) for processing and not stored long-term.</li>
        </ul>

        <h2 className="text-base font-bold">2. How we use your data</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To provide the Service (track your inventory, generate recipes, send expiry reminders).</li>
          <li>To process payments and manage subscriptions (via Paddle, our Merchant of Record).</li>
          <li>To prevent fraud, abuse, and unauthorized access.</li>
          <li>To improve the Service and fix bugs.</li>
          <li>To respond to support requests.</li>
        </ul>
        <p>
          Legal bases (where GDPR applies): performance of the contract with you, our legitimate interests
          in operating and securing the Service, compliance with legal obligations, and your consent where
          required (e.g. push notifications).
        </p>

        <h2 className="text-base font-bold">3. Who we share data with</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Paddle.com Market Ltd</strong> — our Merchant of Record. Paddle handles all checkout, billing, tax, invoicing, and refund processing. See <a className="underline" href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">Paddle's privacy notice</a>.</li>
          <li><strong>Supabase</strong> — our hosting and database provider.</li>
          <li><strong>Lovable AI Gateway / Google Gemini</strong> — when you scan a receipt, fridge photo, or product label, the image is sent to this AI service to extract item names and expiry dates. Images are not retained by us after processing.</li>
          <li><strong>Open Food Facts</strong> — when you scan a barcode, the code is sent to the public Open Food Facts API to retrieve product info.</li>
          <li><strong>Authorities</strong> — where required by law.</li>
        </ul>
        <p>We do not sell your personal data and do not use it for third-party advertising.</p>

        <h2 className="text-base font-bold">4. International transfers</h2>
        <p>
          Our service providers may process data outside your home country, including in the United States.
          Where required by law, we rely on appropriate safeguards (such as the EU Standard Contractual Clauses)
          for those transfers.
        </p>

        <h2 className="text-base font-bold">5. Data retention</h2>
        <p>
          We keep your account data and inventory for as long as your account is active. When you delete
          your account from the Account screen, all your personal data is permanently removed within 30 days,
          except for records we are required to keep for legal, tax, or fraud-prevention purposes.
        </p>

        <h2 className="text-base font-bold">6. Your rights</h2>
        <p>
          Depending on your jurisdiction, you may have the right to access, correct, delete, restrict, or
          port your personal data, to object to processing, to withdraw consent, and to complain to your
          local supervisory authority. To exercise these rights, email us at{" "}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You can also delete
          your account at any time from <Link to="/account" className="underline">Account → Delete account</Link>.
        </p>

        <h2 className="text-base font-bold">7. Security</h2>
        <p>
          We use industry-standard technical and organisational measures including encryption in transit
          (TLS), encryption at rest, access controls, and row-level security on our database. No system is
          perfectly secure; please report suspected vulnerabilities to {CONTACT_EMAIL}.
        </p>

        <h2 className="text-base font-bold">8. Children</h2>
        <p>FridgeSpy is not directed at children under 13 and we do not knowingly collect their data.</p>

        <h2 className="text-base font-bold">9. Changes</h2>
        <p>
          We may update this notice. Material changes will be communicated in the app. The "Last updated"
          date at the top reflects the current version.
        </p>

        <h2 className="text-base font-bold">10. Contact</h2>
        <p>
          {LEGAL_NAME} · <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p className="pt-4">
          See also our <Link to="/terms" className="underline">Terms of Service</Link>.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
