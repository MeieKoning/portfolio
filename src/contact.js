import { CONTACT_COPY, FORMSPREE_ID } from './config.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RULES = {
  name: (v) => (v.trim() ? '' : 'Please enter your name.'),
  email: (v) => {
    if (!v.trim()) return 'Please enter your email.';
    return EMAIL_RE.test(v.trim()) ? '' : 'That email address does not look right.';
  },
  message: (v) => (v.trim().length >= 10 ? '' : 'Please write a short message (at least 10 characters).'),
};

export function initContact({ onSuccess } = {}) {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.form__status');
  const submit = form.querySelector('.form__submit');
  const fields = Object.keys(RULES).map((name) => form.elements[name]);

  const applyIntent = () => {
    const intent = form.elements.intent.value;
    const copy = CONTACT_COPY[intent];
    form.elements.name.placeholder = copy.name;
    form.elements.email.placeholder = copy.email;
    form.elements.message.placeholder = copy.message;
    form.dataset.intent = intent;
  };
  form.querySelectorAll('input[name="intent"]').forEach((r) => r.addEventListener('change', applyIntent));
  applyIntent();

  const validateField = (input) => {
    const error = RULES[input.name](input.value);
    const errorEl = document.getElementById(`${input.id}-error`);
    errorEl.textContent = error;
    if (error) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    input.closest('.field').classList.toggle('is-invalid', Boolean(error));
    return !error;
  };

  // Validate on blur once touched, and live once a field has shown an error.
  fields.forEach((input) => {
    input.addEventListener('blur', () => input.value && validateField(input));
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-invalid')) validateField(input);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    form.classList.remove('is-error');

    const invalid = fields.filter((input) => !validateField(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const intent = form.elements.intent.value;
    const data = new FormData(form);
    data.set('_subject', CONTACT_COPY[intent].subject);

    form.classList.add('is-sending');
    submit.disabled = true;
    try {
      if (!FORMSPREE_ID || FORMSPREE_ID === 'YOUR_FORM_ID') {
        throw new Error('The contact form is not connected yet. Please email meie.koning@gmail.com.');
      }
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.errors?.map((x) => x.message).join(', ') || 'Something went wrong. Please try again.');
      }
      form.reset();
      applyIntent();
      form.classList.add('is-sent');
      status.textContent = 'Thanks! Your message is on its way. Expect a reply within two days.';
      onSuccess?.(form);
    } catch (err) {
      form.classList.add('is-error');
      status.textContent = err.message;
    } finally {
      form.classList.remove('is-sending');
      submit.disabled = false;
    }
  });
}
