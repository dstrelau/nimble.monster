import Link from "next/link";
import { SITE_EMAIL, SITE_NAME } from "@/lib/utils/branding";

export default function TermsPage() {
  const email = SITE_EMAIL;

  return (
    <div className="prose dark:prose-invert">
      <p className="last-updated">
        <strong>Last Updated:</strong> 2025-09-23
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using {SITE_NAME} ("the Service"), you agree to be bound
        by these Terms of Service ("Terms"). If you do not agree to these Terms,
        do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        {SITE_NAME} is a web-based platform that allows users to create,
        organize, and share homebrew content for the Nimble TTRPG system.
      </p>

      <h2>3. Service Disclaimer</h2>
      <p>
        The Service is provided "as is" and may contain bugs, errors, or other
        issues. <strong>Data loss may occur.</strong> We recommend keeping
        backups of important content. We make no guarantees about service
        availability, data persistence, or functionality.
      </p>

      <h2>4. User Accounts</h2>

      <p>
        You are responsible for maintaining the security of your account. You
        are responsible for all activities that occur under your account. We
        reserve the right to suspend or terminate accounts that violate these
        Terms or for any other reason at our discretion.
      </p>

      <h2>5. User-Generated Content</h2>

      <h3>5.1 Your Content</h3>
      <p>
        You retain ownership of all content you upload to the Service; however,
        you grant {SITE_NAME} a non-exclusive, worldwide license to host, store,
        and display your content as necessary to provide the Service.
      </p>
      <p>
        You are solely responsible for the content you create and share.
        <strong>
          {" "}
          Do not upload or share the copyrighted material unless you have
          permission from the copyright owner.
        </strong>
      </p>

      <h3>5.2 Content Standards</h3>
      <p>You agree not to create or share content that:</p>
      <ul>
        <li>Violates any applicable laws or regulations.</li>
        <li>Infringes on intellectual property rights of others.</li>
        <li>Contains hate speech, harassment, or discriminatory content.</li>
        <li>Is pornographic or sexually explicit.</li>
        <li>Contains malicious code or attempts to compromise the Service.</li>
      </ul>
      <p>
        Violation of these Standards WILL result in account termination,
        including permanent deletion of all content associated with your
        account.
      </p>

      <h3>5.3 Public Content</h3>
      <p>
        Content marked as "public" may be viewed by all users.Public content may
        be featured or promoted within the Service. You understand that public
        content may be indexed by search engines.
      </p>

      <h3>5.4 Content Removal</h3>
      <p>
        We reserve the right to remove any content that violates these Terms or
        for any other reason at our discretion.
      </p>

      <h2>6. Intellectual Property</h2>

      <p>
        {SITE_NAME} is published under the Nimble 3rd Party Creator License and
        is not affiliated with Nimble Co. Nimble © 2025 Nimble Co. Users must
        comply with the Nimble 3rd Party Creator License when creating content.
      </p>

      <h2>7. Privacy and Data Collection</h2>
      <p>
        We collect information necessary to provide the Service, including
        Discord authentication data. We may collect usage analytics to improve
        the Service. We do not sell or share personal information with third
        parties except as necessary to operate the Service.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        <strong>TO THE FULLEST EXTENT PERMITTED BY LAW:</strong> THE SERVICE IS
        PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND WE ARE NOT LIABLE FOR
        ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OUR TOTAL LIABILITY
        SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID FOR THE SERVICE (IF ANY).
        WE ARE NOT RESPONSIBLE FOR DATA LOSS, SERVICE INTERRUPTIONS, OR SECURITY
        BREACHES.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless {SITE_NAME} and its operators
        from any claims, damages, or expenses arising from your use of the
        Service or violation of these Terms.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time. Account deletion may result
        in permanent loss of your content. We may terminate or suspend your
        access to the Service at any time for any reason, including violation of
        these Terms.
      </p>

      <h2>11. Contact for Disputes</h2>
      <p>
        For any disputes or concerns, please contact{" "}
        <Link href={`mailto:${email}`}>{email}</Link>.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Changes will be
        effective immediately upon posting. Continued use of the Service after
        changes constitutes acceptance of the new Terms.
      </p>

      <h2>13. Severability</h2>
      <p>
        If any provision of these Terms is found to be invalid or unenforceable,
        the remaining provisions will remain in full force and effect.
      </p>
    </div>
  );
}
