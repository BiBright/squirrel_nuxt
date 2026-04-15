<template>
  <div class="settings-section">
    <h2 class="settings-section-title title02">Support</h2>
    <p class="settings-section-subtitle body01">Find solutions, explore tutorials, or reach out for personalized
      assistance.</p>

    <template v-if="!activeTab">
      <div class="support-content">
        <div class="support-hero">
          <p class="title02">How can we help you?</p>
        </div>

        <div class="support-cards">
          <button type="button" class="support-card" @click="activeTab = 'faq'">
            <span class="material-icons-round support-card__icon">quiz</span>
            <div class="support-card__info">
              <p class="support-card__title cta2">FAQs</p>
              <p class="support-card__sub caption3">Common questions, quick answers.</p>
            </div>
          </button>
          <button type="button" class="support-card" @click="activeTab = 'tutorials'">
            <span class="material-icons-round support-card__icon">ondemand_video</span>
            <div class="support-card__info">
              <p class="support-card__title cta2">Tutorials</p>
              <p class="support-card__sub caption3">Step-by-step guides, easy learning.</p>
            </div>
          </button>
          <button type="button" class="support-card" @click="activeTab = 'contact'">
            <span class="material-icons-round support-card__icon">contact_support</span>
            <div class="support-card__info">
              <p class="support-card__title cta2">Get in touch</p>
              <p class="support-card__sub caption3">Reach out for help directly.</p>
            </div>
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <button type="button" class="support-back cta2" @click="activeTab = null">
        <span class="material-icons-round">arrow_back</span>
        Back
      </button>

      <!-- FAQs -->
      <div v-if="activeTab === 'faq'" class="support-faq">
        <div v-for="(item, i) in faqs" :key="i" class="faq-item">
          <button type="button" class="faq-item__question cta2" @click="openFaq = openFaq === i ? null : i">
            {{ item.question }}
            <span class="material-icons-round faq-item__chevron">{{ openFaq === i ? 'expand_less' : 'expand_more'
              }}</span>
          </button>
          <div v-if="openFaq === i" class="faq-item__answer body01">
            {{ item.answer }}
          </div>
        </div>
      </div>

      <!-- Tutorials -->
      <div v-else-if="activeTab === 'tutorials'" class="support-tutorials">
        <div v-for="(t, i) in tutorials" :key="i" class="tutorial-item">
          <span class="material-icons-round tutorial-item__icon">play_circle_outline</span>
          <div class="tutorial-item__info">
            <p class="tutorial-item__title cta2">{{ t.title }}</p>
            <p class="tutorial-item__duration caption3">{{ t.duration }}</p>
          </div>
        </div>
      </div>

      <!-- Get in Touch -->
      <div v-else-if="activeTab === 'contact'" class="support-contact">
        <template v-if="sent">
          <div class="contact-success">
            <span class="material-icons-round contact-success__icon">check_circle</span>
            <p class="contact-success__title cta2">Message sent!</p>
            <p class="contact-success__sub body01">We'll get back to you as soon as possible.</p>
          </div>
        </template>
        <template v-else>
          <form novalidate @submit.prevent="onSend">
            <div class="form-group">
              <label class="label01">Subject</label>
              <input v-model="contactForm.subject" type="text" class="input-text" placeholder="How can we help?" />
            </div>
            <div class="form-group">
              <label class="label01">Message</label>
              <textarea v-model="contactForm.message" class="input-textarea" placeholder="Describe your problem" />
            </div>
            <p class="contact-terms caption3">
              By clicking 'Send message' you are agreeing to our
              <a href="#" class="contact-terms__link">Terms &amp; Conditions</a> and
              <a href="#" class="contact-terms__link">Privacy Policy</a>.
            </p>
            <AppButton type="submit" :loading="sending" :disabled="!contactForm.subject || !contactForm.message">
              Send message
            </AppButton>
          </form>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const toast = useAppToast()
const api = useApi()

const activeTab = ref<'faq' | 'tutorials' | 'contact' | null>(null)
const openFaq = ref<number | null>(null)

const faqs = [
  { question: 'How do I create a new form?', answer: 'Navigate to Forms in the sidebar, click "New Form", add your fields and save.' },
  { question: 'How do I add a supplier?', answer: 'Go to Suppliers, click "New Supplier", fill in their details and save. They will receive an invitation email.' },
  { question: 'How do I send a request?', answer: 'Go to Requests, click "New Request", select the forms and suppliers, then submit.' },
  { question: 'How do I manage user roles?', answer: 'Go to Users, edit the user and select their role — Admin or Company User.' },
]

const tutorials = [
  { title: 'How to create a form', duration: '3:34 min' },
  { title: 'How to create a field', duration: '2:34 min' },
  { title: 'How to add a user', duration: '4:34 min' },
  { title: 'How to delete a user', duration: '3:12 min' },
  { title: 'How to update a user', duration: '5:20 min' },
  { title: 'How to edit a form', duration: '6:15 min' },
]

const contactForm = reactive({ subject: '', message: '' })
const sending = ref(false)
const sent = ref(false)

async function onSend() {
  if (!contactForm.subject || !contactForm.message) return
  sending.value = true
  try {
    await api('/support/contact', { method: 'POST', body: contactForm })
    sent.value = true
  }
  catch (err) {
    toast.error(err, 'Could not send message', { category: 'general' })
  }
  finally { sending.value = false }
}
</script>

<style scoped>
@use '~/assets/scss/base/variables' as *;

.support-content {
  border-radius: var(--radius-md);
  padding: var(--space-14) var(--space-8);
  background-color: var(--color-white);
}

.support-hero {
  text-align: center;
  margin-bottom: var(--space-12);

  &__title {
    color: var(--color-black);
  }
}

.support-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.support-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-white80);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  border: none;

  &:hover {
    background: var(--color-white60);
  }
}

.support-card__icon {
  font-size: 24px;
  color: var(--color-primary);
  background: var(--color-primary-25);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.support-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.support-card__title {
  color: var(--color-primary);
}

.support-back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  cursor: pointer;
  color: $primary100;
  padding: 0;
  margin-bottom: var(--space-6);
  font-family: $font-base;

  &:hover {
    text-decoration: underline;
  }
}

.faq-item {
  border-bottom: 1px solid $black20;

  &:first-child {
    border-top: 1px solid $black20;
  }
}

.faq-item__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4) 0;
  background: none;
  border: none;
  cursor: pointer;
  color: $black;
  text-align: left;
  font-family: $font-base;
  gap: var(--space-3);
}

.faq-item__chevron {
  flex-shrink: 0;
  font-size: 20px;
  color: $black60;
}

.faq-item__answer {
  color: $black60;
  padding-bottom: var(--space-4);
}

.support-tutorials {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tutorial-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: $black5;
  border: 1px solid $black10;
  border-radius: var(--radius-md);
}

.tutorial-item__icon {
  font-size: 28px;
  color: $primary100;
}

.tutorial-item__title {
  color: $black;
}

.tutorial-item__duration {
  color: $black60;
  margin-top: var(--space-1);
}

.contact-terms {
  color: $black60;
  margin-bottom: var(--space-4);
}

.contact-terms__link {
  color: $primary100;
}

.contact-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10) 0;
  text-align: center;
}

.contact-success__icon {
  font-size: 48px;
  color: $primary100;
}

.contact-success__title {
  color: $black;
}

.contact-success__sub {
  color: $black60;
}
</style>
