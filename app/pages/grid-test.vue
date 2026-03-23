<template>
  <div class="grid-test">

    <!-- Breakpoint indicator -->
    <div class="breakpoint-badge">
      <span class="bp bp--xs">📱 mobile (&lt;768px)</span>
      <span class="bp bp--sm">📱 sm (768px+)</span>
      <span class="bp bp--md">💻 md (1280px+)</span>
      <span class="bp bp--xl">🖥️ xl (1440px+)</span>
      <span class="bp bp--xxl">🖥️ xxl (1536px+)</span>
    </div>

    <div class="container">

      <!-- Title -->
      <div class="section-title">Grid System — 12 columns</div>

      <!-- 12 individual columns -->
      <section>
        <div class="label">12 × col-1</div>
        <div class="row">
          <div v-for="n in 12" :key="n" class="col-1">
            <div class="cell">{{ n }}</div>
          </div>
        </div>
      </section>

      <!-- halves -->
      <section>
        <div class="label">2 × col-6</div>
        <div class="row">
          <div class="col-6"><div class="cell">6</div></div>
          <div class="col-6"><div class="cell">6</div></div>
        </div>
      </section>

      <!-- thirds -->
      <section>
        <div class="label">3 × col-4</div>
        <div class="row">
          <div class="col-4"><div class="cell">4</div></div>
          <div class="col-4"><div class="cell">4</div></div>
          <div class="col-4"><div class="cell">4</div></div>
        </div>
      </section>

      <!-- quarters -->
      <section>
        <div class="label">4 × col-3</div>
        <div class="row">
          <div class="col-3"><div class="cell">3</div></div>
          <div class="col-3"><div class="cell">3</div></div>
          <div class="col-3"><div class="cell">3</div></div>
          <div class="col-3"><div class="cell">3</div></div>
        </div>
      </section>

      <!-- asymmetric -->
      <section>
        <div class="label">col-8 + col-4</div>
        <div class="row">
          <div class="col-8"><div class="cell cell--accent">8</div></div>
          <div class="col-4"><div class="cell">4</div></div>
        </div>
      </section>

      <!-- asymmetric -->
      <section>
        <div class="label">col-3 + col-9</div>
        <div class="row">
          <div class="col-3"><div class="cell">3</div></div>
          <div class="col-9"><div class="cell cell--accent">9</div></div>
        </div>
      </section>

      <!-- responsive -->
      <section>
        <div class="label">Responsive — col-12 / col-sm-6 / col-md-4 / col-xl-3</div>
        <div class="row">
          <div v-for="n in 4" :key="n" class="col-12 col-sm-6 col-md-4 col-xl-3">
            <div class="cell cell--responsive">col-12 sm-6 md-4 xl-3</div>
          </div>
        </div>
      </section>

      <!-- responsive 2-col sidebar pattern -->
      <section>
        <div class="label">Sidebar pattern — col-12 / col-sm-12 / col-md-3 + col-md-9</div>
        <div class="row">
          <div class="col-12 col-md-3">
            <div class="cell cell--sidebar">Sidebar</div>
          </div>
          <div class="col-12 col-md-9">
            <div class="cell cell--main">Main content</div>
          </div>
        </div>
      </section>

      <!-- flex col -->
      <section>
        <div class="label">Auto flex — .col</div>
        <div class="row">
          <div class="col"><div class="cell">auto</div></div>
          <div class="col"><div class="cell">auto</div></div>
          <div class="col"><div class="cell">auto</div></div>
          <div class="col"><div class="cell">auto</div></div>
          <div class="col"><div class="cell">auto</div></div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.grid-test {
  min-height: 100vh;
  background: #f0f2f5;
}

.breakpoint-badge {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1000;
  font-size: 12px;
  font-weight: 600;
}

.bp {
  display: none;
  padding: 4px 10px;
  border-radius: 20px;
  background: #1e293b;
  color: #fff;
}

/* Show only the active breakpoint */
@media (max-width: 767px)                        { .bp--xs  { display: inline-block; } }
@media (min-width: 768px)  and (max-width: 1279px) { .bp--sm  { display: inline-block; } }
@media (min-width: 1280px) and (max-width: 1439px) { .bp--md  { display: inline-block; } }
@media (min-width: 1440px) and (max-width: 1535px) { .bp--xl  { display: inline-block; } }
@media (min-width: 1536px)                       { .bp--xxl { display: inline-block; } }

/* Section */
section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 28px;
  color: #1e293b;
}

.label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  margin-bottom: 6px;
}

/* Cells */
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #cbd5e1;
  color: #1e293b;
  border: 1px solid #94a3b8;
}

.cell--accent   { background: #6366f1; color: #fff; border-color: #4f46e5; }
.cell--responsive { background: #0ea5e9; color: #fff; border-color: #0284c7; font-size: 10px; }
.cell--sidebar  { background: #f59e0b; color: #fff; border-color: #d97706; min-height: 80px; }
.cell--main     { background: #10b981; color: #fff; border-color: #059669; min-height: 80px; }
</style>
