<template>
  <div class="settings-section">
    <h2 class="settings-section-title title02">Legal Notice</h2>
    <p class="settings-section-subtitle body01">Last revised: 08th of February 2023</p>

    <div class="legal-content">
      <p class="body01">Please read these terms and conditions carefully before using this website. By using this website you confirm that you accept these terms of use and that you agree to comply with them.</p>

      <div class="legal-section">
        <h3 class="legal-section__title title03">1. Intellectual property rights</h3>
        <p class="body01">Unless otherwise stated, Bi-silque and/or its licensors own the intellectual property rights in the website and material on the website. Subject to the licence below, all these intellectual property rights are reserved.</p>
        <p class="body01">You may view, download for caching purposes only, and print pages from the website for your own personal use, subject to the restrictions set out below and elsewhere in these terms and conditions.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">2. Restrictions</h3>
        <p class="body01">You must not:</p>
        <ul class="legal-list body01">
          <li>Republish material from this website (including republication on another website)</li>
          <li>Sell, rent or sub-license material from the website</li>
          <li>Show any material from the website in public</li>
          <li>Use this website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website</li>
          <li>Use this website in any way that is unlawful, illegal, fraudulent or harmful</li>
          <li>Use this website to copy, store, host, transmit, send, use, publish or distribute any material which consists of spyware, computer virus, Trojan horse, worm, keystroke logger, rootkit or other malicious software</li>
          <li>Conduct any data collection or extraction activities on or in relation to our website without our express written consent</li>
          <li>Use this website to transmit or send unsolicited commercial communications</li>
          <li>Access or otherwise interact with any part of this website using any robot, spider or other automated means</li>
        </ul>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">3. Your content</h3>
        <p class="body01">In these terms and conditions, "your content" means material (including without limitation text, images, audio material, video material and audio-visual material) that you submit to this website, for whatever purpose.</p>
        <p class="body01">You grant to Bi-silque a worldwide, irrevocable, non-exclusive, royalty-free licence to use, reproduce, adapt, publish, translate and distribute your content in any existing or future media. You also grant to Bi-silque the right to sub-license these rights, and the right to bring an action for infringement of these rights.</p>
        <p class="body01">Your content must not be illegal or unlawful, must not infringe any third party's legal rights, and must not be capable of giving rise to legal action whether against you or Bi-silque or a third party.</p>
        <p class="body01">Bi-silque reserves the right to edit or remove any material submitted to this website, or stored on Bi-silque's servers, or hosted or published upon this website.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">4. No warranties</h3>
        <p class="body01">This website is provided "as is" without any representations or warranties, express or implied. Bi-silque makes no representations or warranties in relation to this website or the information and materials provided on this website.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">5. Limitation of liability</h3>
        <p class="body01">Bi-silque will not be liable to you (whether under the law of contact, the law of torts or otherwise) in relation to the contents of, or use of, or otherwise in connection with, this website for any direct loss, indirect loss, special, incidental or consequential loss.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">6. Indemnification</h3>
        <p class="body01">You hereby indemnify Bi-silque and undertake to keep Bi-silque indemnified against any losses, damages, costs, liabilities and expenses (including, without limitation, legal expenses and any amounts paid by Bi-silque to a third party in settlement of a claim or dispute) incurred or suffered by Bi-silque arising out of any breach by you of any provision of these terms and conditions.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">7. Severability</h3>
        <p class="body01">If a provision of these terms and conditions is determined by any court or other competent authority to be unlawful and/or unenforceable, the other provisions will continue in effect. If any unlawful and/or unenforceable provision would be lawful or enforceable if part of it were deleted, that part will be deemed to be deleted, and the rest of the provision will continue in effect.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">8. Variation of terms</h3>
        <p class="body01">Bi-silque may revise these terms and conditions from time to time. Revised terms and conditions will apply to the use of this website from the date of the publication of the revised terms and conditions on this website.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">9. Assignment</h3>
        <p class="body01">Bi-silque may transfer, sub-contract or otherwise deal with Bi-silque's rights and/or obligations under these terms and conditions without notifying you or obtaining your consent. You may not transfer, sub-contract or otherwise deal with your rights and/or obligations under these terms and conditions.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">10. Entire agreement</h3>
        <p class="body01">These terms and conditions, together with the Privacy Policy, constitute the entire agreement between you and Bi-silque in relation to your use of this website, and supersede all previous agreements in respect of your use of this website.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">11. Governing law &amp; jurisdiction</h3>
        <p class="body01">These terms and conditions will be governed by and construed in accordance with Portuguese law, and any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of Portugal.</p>
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
</style>
