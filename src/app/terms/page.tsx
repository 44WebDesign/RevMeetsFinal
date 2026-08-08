import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using RevMeet.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "8 August 2026";

export default function TermsPage() {
  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sec-label">Legal</div>
        <h1 className="sec-title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>TERMS OF SERVICE</h1>
        <p style={{ color: "var(--mut)", marginBottom: "2rem" }}>Last updated: {UPDATED}</p>

        <div className="legal-body">
          <p>
            Welcome to RevMeet. These Terms of Service (&quot;Terms&quot;) govern your use of the
            RevMeet website and services (the &quot;Platform&quot;). By creating an account or
            using the Platform, you agree to these Terms. If you do not agree, please do not
            use the Platform.
          </p>

          <h2>1. Who we are</h2>
          <p>
            RevMeet is an online platform that helps car enthusiasts discover events, and
            helps event organisers, clubs and venues promote and manage car events across
            the UK. RevMeet provides the platform only; events are organised by the hosts
            and venues who list them, not by RevMeet.
          </p>

          <h2>2. Accounts</h2>
          <ul>
            <li>You must be at least 16 years old to create an account.</li>
            <li>You are responsible for keeping your login details secure and for all activity under your account.</li>
            <li>You must provide accurate information and keep it up to date.</li>
            <li>You may choose an account type (enthusiast, event host/club, or venue). Hosts and venues are responsible for the accuracy of the events and profiles they publish.</li>
          </ul>

          <h2>3. Events, hosts and venues</h2>
          <ul>
            <li>Event organisers are solely responsible for their events, including accuracy of details, safety, permissions, insurance, and compliance with applicable laws.</li>
            <li>RevMeet does not verify, endorse, or guarantee any event, host or venue, and is not a party to any arrangement between attendees and organisers.</li>
            <li>Registering for an event through RevMeet expresses interest in attending; it does not create a contract with RevMeet. Any tickets, fees or entry conditions are set by the organiser.</li>
            <li>Attendance at any event is at your own risk. Always follow the organiser&apos;s instructions and drive responsibly and legally.</li>
          </ul>

          <h2>4. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Post false, misleading, unlawful, offensive, or infringing content.</li>
            <li>Promote unsafe, illegal, or dangerous driving activity (including street racing on public roads).</li>
            <li>Impersonate others, or misuse the Platform, its data, or other users&apos; information.</li>
            <li>Attempt to disrupt, scrape, or gain unauthorised access to the Platform.</li>
          </ul>
          <p>We may remove content or suspend accounts that breach these Terms.</p>

          <h2>5. Your content</h2>
          <p>
            You retain ownership of the content you post (event listings, profiles, images,
            reviews). By posting, you grant RevMeet a non-exclusive, worldwide licence to
            host and display that content for the purpose of operating the Platform. You are
            responsible for having the rights to any content you upload.
          </p>

          <h2>6. Reviews</h2>
          <p>
            Reviews must reflect genuine experiences and follow the acceptable use rules
            above. We may remove reviews that are fake, abusive, or violate these Terms.
          </p>

          <h2>7. Availability and changes</h2>
          <p>
            We aim to keep the Platform available but do not guarantee it will be
            uninterrupted or error-free. We may change, suspend, or discontinue features at
            any time, and may update these Terms; continued use after changes means you
            accept the updated Terms.
          </p>

          <h2>8. Liability</h2>
          <p>
            To the fullest extent permitted by law, RevMeet is not liable for any loss or
            damage arising from your use of the Platform, from any event you attend or
            organise, or from dealings with other users. Nothing in these Terms excludes
            liability that cannot be excluded under law.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these Terms? Contact us via the email address associated with
            the Platform. See our <a href="/privacy">Privacy Policy</a> for how we handle
            your data.
          </p>
        </div>
      </div>
    </section>
  );
}
