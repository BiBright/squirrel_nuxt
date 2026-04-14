<template>
  <div class="settings-section">
    <h2 class="settings-section-title title02">Privacy Policy</h2>
    <p class="settings-section-subtitle body01">Last revised: 06th of January 2023</p>

    <div class="legal-content">
      <p class="body01">By accessing our websites (bisilque.com, bi-office.com, mastervision-products.com) you consent to the collection and use of your personal information as described in this Privacy Policy.</p>

      <div class="legal-section">
        <h3 class="legal-section__title title03">1. Who will hold your information?</h3>
        <p class="body01">Your information will be held by Bi-silque, S.A., a company registered in Portugal with VAT No. 500924902, with registered address at Rua Cais da Estação, Nº340, 3885-528 Esmoriz, Portugal.</p>
        <p class="body01">If the business is sold or integrated with another business, your details may be disclosed to our advisers and any prospective purchasers and their advisers, and will be passed on to the new owners of the business.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">2. Information collected</h3>
        <p class="body01">We may collect and process the following types of personal information:</p>
        <ul class="legal-list body01">
          <li>Personal contact details such as name, title, address, telephone numbers and email addresses</li>
          <li>Technical information, including the IP address used to connect to the Internet, browser type and version, time zone setting, operating system and platform</li>
          <li>Records of any correspondence if you contact us</li>
          <li>Details of transactions you carry out through our website</li>
        </ul>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">3. How information is gathered</h3>
        <p class="body01">We gather information through:</p>
        <ul class="legal-list body01">
          <li>Information you supply to us when using our services</li>
          <li>Cookies and tracking technologies as described in our Cookies Policy</li>
          <li>Telephone, email or written correspondence with us</li>
          <li>Direct marketing activities</li>
          <li>Monitoring or recording of calls, emails, text messages and other communications for staff training and legal compliance</li>
        </ul>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">4. Purposes for using information</h3>
        <p class="body01">We use your information to:</p>
        <ul class="legal-list body01">
          <li>Provide our services, including administration, content personalisation, and identity verification</li>
          <li>Send technical, administrative and legal notices</li>
          <li>Send marketing communications where you have consented</li>
          <li>Conduct research and statistical analysis to improve our services</li>
          <li>Disclose to subsidiary companies or other legal entities where required</li>
        </ul>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">5. Keeping information up to date and secure</h3>
        <p class="body01">You can update your personal information at any time through your profile settings. We are committed to ensuring your information is secure and have put in place appropriate physical, electronic and managerial procedures to safeguard the information we collect.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">6. Your rights</h3>
        <p class="body01">Under GDPR, you have the following rights:</p>
        <ul class="legal-list body01">
          <li><strong>Right to be informed</strong> — about the collection and use of your personal data</li>
          <li><strong>Right of access</strong> — to your personal data (response within 40 days)</li>
          <li><strong>Right of rectification</strong> — to have inaccurate data corrected</li>
          <li><strong>Right to erasure</strong> — the "right to be forgotten"</li>
          <li><strong>Right to restrict processing</strong> — in certain circumstances</li>
          <li><strong>Right to data portability</strong> — to receive your data in a usable format</li>
          <li><strong>Right to object</strong> — to processing of your personal data</li>
          <li><strong>Rights regarding automated decision-making and profiling</strong></li>
        </ul>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">7. Changes to this policy</h3>
        <p class="body01">We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised date. We encourage you to review this policy periodically.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">8. Contact details</h3>
        <p class="body01">For any privacy-related enquiries, please contact us at <a class="privacy-link" href="mailto:privacy@bisilque.com">privacy@bisilque.com</a>.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-8);
}

.legal-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
}

.legal-section__title { color: var(--color-text); }

.legal-list {
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text-muted);
}

.privacy-link { color: var(--color-primary); }
</style>
