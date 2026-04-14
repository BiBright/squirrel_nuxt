<template>
  <div class="settings-section">
    <h2 class="settings-section-title title02">Cookies Policy</h2>
    <p class="settings-section-subtitle body01">Last revised: 06th of January 2023</p>

    <div class="legal-content">
      <p class="body01">This website uses cookies to ensure you get the best experience. By continuing to browse the site, you agree to our use of cookies.</p>

      <div class="legal-section">
        <h3 class="legal-section__title title03">1. Information collected</h3>
        <p class="body01">We use cookies to monitor browsing behaviour on our site. We use both first-party cookies (set by us) and third-party cookies (set by a third party). These cookies may be temporary (session) or permanent.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">2. Who sets cookies</h3>
        <p class="body01">Cookies are placed by our website and by selected third-party services that help us deliver a better experience.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">3. What are cookies used for</h3>
        <p class="body01">Cookies are used to operate the website technically and to monitor how users navigate and interact with the site, in order to improve the experience over time.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">4. How do I disable cookies</h3>
        <p class="body01">You can disable cookies at any time through your browser settings. Each browser has a different method — refer to your browser's help section for instructions.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">5. What happens if I disable cookies</h3>
        <p class="body01">If you disable cookies, some features of this website may not work as intended. Authentication and session management rely on cookies and may not function correctly without them.</p>
      </div>

      <div class="legal-section">
        <h3 class="legal-section__title title03">6. Cookies used on this website</h3>

        <div class="cookies-table-wrap">
          <table class="cookies-table">
            <thead>
              <tr>
                <th class="caption2">Cookie</th>
                <th class="caption2">Provider</th>
                <th class="caption2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cookie in cookies" :key="cookie.name">
                <td class="caption3 cookies-table__name">{{ cookie.name }}</td>
                <td class="caption3">{{ cookie.provider }}</td>
                <td class="caption3">{{ cookie.purpose }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="body01"><strong>Analytics cookies:</strong> None currently used.</p>
        <p class="body01"><strong>Marketing cookies:</strong> None currently used.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const cookies = [
  { name: 'cookieConsent', provider: 'This website', purpose: 'Records that the user has accepted the cookie notice.' },
  { name: 'cookieyes-consent', provider: 'CookieYes', purpose: 'Stores the user\'s cookie consent preferences.' },
  { name: 'laravel_session', provider: 'Laravel Framework', purpose: 'Maintains the user\'s session across page requests.' },
  { name: 'PHPSESSID', provider: 'PHP', purpose: 'Stores temporary session information.' },
  { name: 'XSRF-TOKEN', provider: 'Laravel Framework', purpose: 'Provides Cross-Site Request Forgery (CSRF) protection.' },
  { name: 'remember_web', provider: 'Laravel Framework', purpose: 'Enables the "remember me" login functionality.' },
]
</script>

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

.cookies-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.cookies-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 1px solid var(--color-border);
  }

  thead th {
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
  }

  tbody tr:last-child td { border-bottom: none; }
}

.cookies-table__name {
  font-family: monospace;
  color: var(--color-primary);
}
</style>
