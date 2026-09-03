import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const LAST_UPDATED = 'August 27, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="mb-8 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <strong>Template notice:</strong> this is a starting-point privacy policy, not legal advice. Replace
          the bracketed placeholders with your real company/contact details and have a lawyer review it before
          launching publicly or submitting it to TikTok, Google, or Meta for app review.
        </div>

        <h1 className="font-display text-3xl font-semibold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-secondary">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">1. Who we are</h2>
            <p>
              ViralPost (&quot;we&quot;, &quot;us&quot;) is operated by [Your Company / Legal Name], [Your
              Address]. You can reach us at [privacy@yourdomain.com] with any questions about this policy or
              your data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">2. What we collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Account data:</strong> name, email address, and a securely hashed password.</li>
              <li><strong>Content you create:</strong> topics, prompts, and the AI-generated scripts, captions
                and hashtags you save.</li>
              <li><strong>Connected platform data:</strong> when you connect a TikTok, YouTube, or Instagram
                account, we store an encrypted OAuth access token (and refresh token, where provided), the
                connected account&apos;s public display name/ID, and the granted permission scopes &mdash;
                solely to publish content on your behalf at the times you schedule.</li>
              <li><strong>Usage data:</strong> login timestamps, IP address, and browser user-agent, kept in a
                security audit log to detect and prevent abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">3. How we use it</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To generate video concepts, you submit a topic which is sent to Anthropic&apos;s API (our AI
                provider) to produce a script, caption and hashtags. We do not use your content to train AI
                models ourselves.</li>
              <li>To publish scheduled posts to the social accounts you explicitly connect, at the times you
                choose, using only the scopes you granted during that platform&apos;s OAuth consent screen.</li>
              <li>To secure your account (fraud prevention, rate limiting, audit logging).</li>
              <li>We do not sell your personal data or your connected accounts&apos; data to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">4. Data from Google / YouTube</h2>
            <p>
              ViralPost&apos;s use and transfer of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-accent-pink hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. We only request the YouTube scopes necessary to upload
              videos on your behalf and read your channel&apos;s basic info, and we never use this data for
              advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">5. Data retention &amp; deletion</h2>
            <p>
              We retain your account and content data until you delete it or close your account. You can
              disconnect a platform account at any time from Connected Accounts, which immediately revokes our
              stored token for it. To request full account deletion, email [privacy@yourdomain.com] &mdash; we
              will delete your data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">6. Security</h2>
            <p>
              Passwords are hashed with bcrypt and never stored in plain text. Connected-platform access and
              refresh tokens are encrypted at rest with AES-256-GCM. All traffic is served over HTTPS in
              production.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">7. Your rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, export, or delete your
              personal data, and to withdraw consent for a connected platform at any time. Contact
              [privacy@yourdomain.com] to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-text-primary">8. Changes to this policy</h2>
            <p>
              We&apos;ll update the &quot;Last updated&quot; date above whenever this policy changes, and
              notify active users of material changes by email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
