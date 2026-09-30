'use strict';

const STORAGE_KEY = 'twinCitiesRescueInquiryDraft';

const interestOptions = [
  { value: 'volunteer', label: 'Volunteering', guidance: 'Share the days and times you may be available to volunteer.' },
  { value: 'foster', label: 'Fostering', guidance: 'Mention your availability and any questions about fostering.' },
  { value: 'adoption', label: 'Adoption information', guidance: 'Tell the rescue what type of adoption information you need.' },
  { value: 'other', label: 'Other', guidance: 'Describe the other way you would like to support the rescue.' }
];

const formFields = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email address' },
  { id: 'phone', label: 'Phone number' },
  { id: 'interest', label: 'Interest' },
  { id: 'availability', label: 'Availability' },
  { id: 'experience', label: 'Pet-care experience' },
  { id: 'message', label: 'Message' }
];

const form = document.getElementById('contact-form');
const interestSelect = document.getElementById('interest');
const formStatus = document.getElementById('form-status');
const summary = document.getElementById('inquiry-summary');

function getInterest(value) {
  return interestOptions.find((option) => option.value === value);
}

function updateInterestGuidance() {
  const selected = getInterest(interestSelect.value);
  document.getElementById('interest-guidance').textContent = selected
    ? selected.guidance
    : 'Choose an interest below to see what information may help the rescue respond.';
}

function readFormData() {
  return Object.fromEntries(formFields.map(({ id }) => [id, document.getElementById(id).value.trim()]));
}

function saveDraft() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(readFormData()));
}

function restoreDraft() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const draft = JSON.parse(saved);
    formFields.forEach(({ id }) => {
      if (typeof draft[id] === 'string') document.getElementById(id).value = draft[id];
    });
    updateInterestGuidance();
    formStatus.textContent = 'Your inquiry draft was restored from this browser tab.';
    if (draft.name || draft.interest) showSummary(draft, false);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function setFieldError(id, message) {
  const field = document.getElementById(id);
  document.getElementById(`${id}-error`).textContent = message;
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateForm() {
  const values = readFormData();
  const errors = {};
  if (!values.name) errors.name = 'Please enter your name.';
  if (!values.email) errors.email = 'Please enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter an email address in a format like name@example.com.';
  if (values.phone && !/^[0-9()+. -]{7,20}$/.test(values.phone)) errors.phone = 'Enter 7 to 20 digits, spaces, or phone punctuation.';
  if (!values.interest) errors.interest = 'Please choose an interest.';
  if (!values.availability) errors.availability = 'Please tell us when you are available.';
  if (!values.experience) errors.experience = 'Please choose an experience level.';
  if (!values.message) errors.message = 'Please enter a short message.';
  else if (values.message.length < 10) errors.message = 'Please enter at least 10 characters.';
  formFields.forEach(({ id }) => setFieldError(id, errors[id] || ''));
  return { valid: Object.keys(errors).length === 0, values };
}

function showSummary(values, submitted) {
  const selected = getInterest(values.interest);
  const interestLabel = selected ? selected.label.toLowerCase() : 'support';
  document.getElementById('summary-text').textContent = values.name
    ? submitted
      ? `${values.name}, your ${interestLabel} inquiry is ready to review. Availability: ${values.availability || 'not entered'}. This demonstration saves the draft in this tab; it does not send a message.`
      : `${values.name}, your saved ${interestLabel} inquiry draft is available. Availability: ${values.availability || 'not entered'}.`
    : 'Your saved inquiry details will appear here.';
  summary.hidden = false;
  if (submitted) formStatus.textContent = 'Your inquiry passed the checks and is ready for review. It has not been sent.';
}

formFields.forEach(({ id }) => {
  document.getElementById(id).addEventListener('input', () => {
    setFieldError(id, '');
    saveDraft();
    if (!summary.hidden) showSummary(readFormData(), false);
  });
  document.getElementById(id).addEventListener('change', () => {
    setFieldError(id, '');
    saveDraft();
    if (id === 'interest') updateInterestGuidance();
    if (!summary.hidden) showSummary(readFormData(), false);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = validateForm();
  saveDraft();
  if (!result.valid) {
    formStatus.textContent = 'Please correct the highlighted fields. Your entries are still here.';
    summary.hidden = true;
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }
  showSummary(result.values, true);
});

restoreDraft();
updateInterestGuidance();
