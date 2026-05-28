import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — FridgeSpy" },
      { name: "description", content: "The agreement between you and FridgeSpy when you use the app: accounts, AI features, subscriptions, refunds, and acceptable use." },
      { property: "og:title", content: "FridgeSpy Terms of Service" },
      { property: "og:description", content: "The agreement between you and FridgeSpy when you use the app." },
      { property: "og:url", content: "https://fridgespy.com/terms" },
    ],
    links: [{ rel: "canonical", href: "https://fridgespy.com/terms" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "FridgeSpy Terms of Service",
        url: "https://fridgespy.com/terms",
        datePublished: "2026-05-28",
        dateModified: "2026-05-28",
        publisher: { "@type": "Organization", name: "FridgeSpy", legalName: "Dream Holdings LLC" },
      }),
    }],
  }),
  component: TermsPage,
});

const LEGAL_NAME = "Dream Holdings LLC";
const CONTACT_EMAIL = "support@fridgespy.app";
const LAST_UPDATED = "May 28, 2026";

function TermsPage() {
  return (
    <div className="min-h-screen px-5 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="flex items-center gap-2 py-3">
        <Link to="/" className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Terms of Service</h1>
      </header>

      <article className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <p>
          These Terms govern your use of the FridgeSpy application and related services (the "Service")
          provided by <strong>{LEGAL_NAME}</strong> ("we", "us"). By creating an account or using the
          Service, you agree to these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-base font-bold">1. Who can use FridgeSpy</h2>
        <p>
          You must be at least 13 years old (or the minimum digital-consent age in your country) to use
          the Service. If you use the Service on behalf of an organisation, you confirm you have authority
          to bind that organisation to these Terms.
        </p>

        <h2 className="text-base font-bold">2. Your account</h2>
        <p>
          You are responsible for keeping your credentials confidential and for all activity under your
          account. Provide accurate information and keep it up to date.
        </p>

        <h2 className="text-base font-bold">3. Acceptable use</h2>
        <p>You must not:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>use the Service unlawfully or fraudulently;</li>
          <li>send spam, malware, or otherwise interfere with the Service or other users;</li>
          <li>scrape, probe, or attempt to bypass security controls;</li>
          <li>infringe anyone else's intellectual property or privacy;</li>
          <li>upload images you do not have the right to submit;</li>
          <li>attempt to reverse engineer, resell, or redistribute the Service.</li>
        </ul>

        <h2 className="text-base font-bold">4. AI features</h2>
        <p>
          FridgeSpy uses AI to read receipts, identify items in fridge photos, parse product labels, and
          generate recipes. AI output may be inaccurate or incomplete. Always verify expiry dates and
          ingredient lists yourself before relying on them, especially where food safety, allergies, or
          dietary restrictions are involved. FridgeSpy does not provide medical, nutritional, or food-safety
          advice. You are responsible for your prompts, your inputs, and how you use the outputs.
        </p>

        <h2 className="text-base font-bold">5. Subscriptions, payment, refunds</h2>
        <p>
          Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is
          the Merchant of Record for all our orders. Paddle provides all customer service inquiries and
          handles returns.
        </p>
        <p>
          Paid plans (Pro Monthly, Pro Yearly, Pro Lifetime) are billed in advance. Subscriptions auto-renew
          at the end of each billing period until canceled. You can cancel at any time from the Account
          screen or via Paddle's customer portal — cancellation takes effect at the end of the current
          billing period. Lifetime plans are a one-time payment with no recurring charges.
        </p>
        <p>
          <strong>Refunds:</strong> we offer a <strong>30-day money-back guarantee</strong>. If you're not
          satisfied with a paid plan, request a refund within 30 days of purchase by contacting Paddle at{" "}
          <a className="underline" href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>{" "}
          or emailing us at {CONTACT_EMAIL}. Free trials convert to a paid subscription automatically unless
          cancelled before the trial ends.
        </p>
        <p>
          Payment, tax, billing, cancellation and refund mechanics are also governed by{" "}
          <a className="underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">
            Paddle's Buyer Terms
          </a>.
        </p>

        <h2 className="text-base font-bold">6. Intellectual property</h2>
        <p>
          We retain all rights, title, and interest in the Service, including its software, design, and
          branding. We grant you a limited, non-exclusive, non-transferable right to use the Service for
          personal, non-commercial purposes within your selected plan.
        </p>
        <p>
          You retain ownership of the data and images you upload. By submitting them you grant us a
          limited licence to host and process them solely to provide the Service to you.
        </p>

        <h2 className="text-base font-bold">7. Service availability</h2>
        <p>
          We aim to keep the Service available but do not guarantee uninterrupted or error-free operation.
          We may modify, suspend, or discontinue parts of the Service at any time.
        </p>

        <h2 className="text-base font-bold">8. Suspension &amp; termination</h2>
        <p>
          We may suspend or terminate your access for material breach of these Terms, non-payment, security
          or fraud risk, or repeated/serious policy violations. You may stop using the Service and delete
          your account at any time from the Account screen. On termination, your data will be deleted
          subject to the retention rules in our Privacy Policy.
        </p>

        <h2 className="text-base font-bold">9. Disclaimer of warranties</h2>
        <p>
          To the fullest extent permitted by law, the Service is provided "as is" and "as available"
          without warranties of any kind, whether express or implied (including merchantability, fitness
          for a particular purpose, and non-infringement).
        </p>

        <h2 className="text-base font-bold">10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, our aggregate liability arising out of or relating to
          the Service shall not exceed the fees you paid us in the 12 months preceding the claim. We are
          not liable for indirect, consequential, special, incidental, or punitive damages, including loss
          of profits, data, or goodwill. Nothing in these Terms limits liability for fraud, death, or
          personal injury caused by negligence where such limitation would be unlawful.
        </p>

        <h2 className="text-base font-bold">11. Indemnity</h2>
        <p>
          You agree to indemnify and hold us harmless from claims arising out of your content, your use of
          the Service in breach of these Terms, or your violation of any law or third-party right.
        </p>

        <h2 className="text-base font-bold">12. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, United States,
          without regard to its conflict-of-laws principles. Disputes will be resolved in
          the competent state or federal courts located in Delaware, unless mandatory
          consumer law in your country of residence provides otherwise.
        </p>

        <h2 className="text-base font-bold">13. Changes</h2>
        <p>
          We may update these Terms. Material changes will be communicated in the app. Continued use after
          the changes take effect constitutes acceptance.
        </p>

        <h2 className="text-base font-bold">14. Contact</h2>
        <p>
          {LEGAL_NAME} · <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        <p className="pt-4">
          See also our <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </article>
      <PublicFooter />
    </div>
  );
}
