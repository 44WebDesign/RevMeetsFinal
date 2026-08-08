import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How RevMeet collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "8 August 2026";

export default function PrivacyPage() {
  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sec-label">Legal</div>
        <h1 className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>PRIVACY POLICY</h1>
        <p style={{ color: "var(--mut)", marginBottom: "2rem" }}>Last updated: {UPDATED}</p>

        <div className="legal-body">
          <p>
            This Privacy Policy explains how RevMeet (&quot;we&quot;) collects, uses and protects
            your personal data when you use our platform, in line with UK data protection
            law (UK GDPR and the Data Protection Act 2018).
          </p>

          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Account data:</strong> your name, email address, password (stored securely hashed), account type, and optional profile details (bio, avatar).</li>
            <li><strong>If you sign in with Google:</strong> your name, email and profile picture from your Google account.</li>
            <li><strong>Content you provide:</strong> events, club/venue profiles, registrations, saved events, follows and reviews.</li>
            <li><strong>Location:</strong> if you use &quot;near me&quot; on the map, your device shares your approximate location with your permission. It is used only in your browser to sort results and is not stored by us.</li>
            <li><strong>Technical data:</strong> basic information such as your IP address and browser, used to operate and secure the service.</li>
          </ul>

          <h2>2. How we use your data</h2>
          <ul>
            <li>To provide and personalise the Platform (accounts, events, saved events, follows).</li>
            <li>To send service emails you would expect — for example event registration confirmations, reminders for events you&apos;ve registered for, and alerts for clubs you follow. You can opt out of non-essential emails.</li>
            <li>To keep the Platform safe, prevent abuse, and comply with legal obligations.</li>
          </ul>

          <h2>3. Legal bases</h2>
          <p>
            We process your data to perform our contract with you (providing the service),
            for our legitimate interests (running and improving the Platform safely), to
            comply with legal obligations, and — where required — with your consent (for
            example, location access and optional marketing).
          </p>

          <h2>4. Sharing</h2>
          <p>We share data only as needed to run the service, with providers such as:</p>
          <ul>
            <li>Our hosting and database providers (to store and serve the Platform).</li>
            <li>Our email provider (to send the service emails described above).</li>
            <li>Google (only if you choose to sign in with Google).</li>
          </ul>
          <p>
            Some information you choose to publish — such as an event, club or venue profile,
            your display name on reviews, or public organiser details — is visible to other
            users and search engines. We do not sell your personal data.
          </p>

          <h2>5. Retention</h2>
          <p>
            We keep your data for as long as your account is active or as needed to provide
            the service and meet legal requirements. You can delete your account, after
            which we will remove or anonymise your personal data, except where we must
            retain some information by law.
          </p>

          <h2>6. Your rights</h2>
          <p>
            Under UK data protection law you have the right to access, correct, delete, or
            restrict processing of your personal data, to object to certain processing, and
            to data portability. You can update much of your information from your account
            settings, or contact us to exercise these rights. You also have the right to
            complain to the Information Commissioner&apos;s Office (ICO).
          </p>

          <h2>7. Cookies</h2>
          <p>
            We use a small number of essential cookies, including one to keep you signed in.
            These are necessary for the Platform to work. We do not use them for advertising.
          </p>

          <h2>8. Contact</h2>
          <p>
            For any privacy questions or requests, contact us via the email address
            associated with the Platform.
          </p>
        </div>
      </div>
    </section>
  );
}
