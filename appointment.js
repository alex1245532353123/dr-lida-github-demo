import { demoSlots } from './demo-slots.js';

const appointment = document.getElementById('appointment');

if (typeof appointment.showModal === 'function') {
  const form = appointment.querySelector('.appointment-request');
  const fields = form.querySelector('fieldset');
  const { clinic, date, time } = form.elements;
  const branchPicker = document.querySelector('.hero-branch');
  const branchOptions = branchPicker.querySelectorAll('input[type="radio"]');
  const phoneLinks = document.querySelectorAll('[data-branch-phone]');
  const routeLink = document.querySelector('[data-branch-route]');
  const submit = form.querySelector('.appointment-submit');
  const availability = form.querySelector('.appointment-availability');
  const result = appointment.querySelector('.appointment-result');
  const description = appointment.querySelector('#appointment-description');
  let opener;
  let submittedClinic;

  function updateBranchLinks() {
    time.value = '';
    const phone = document.getElementById(`phone-${clinic.value}`);
    const route = document.getElementById(`route-${clinic.value}`);
    for (const option of branchOptions) option.checked = option.value === clinic.value;
    for (const link of phoneLinks) {
      const city = link.querySelector('.phone-city');
      city.hidden = !phone;
      city.textContent = phone ? clinic.selectedOptions[0].textContent : '';
      link.href = phone?.href || '#contacts';
      link.querySelector('[data-phone-label]').textContent = phone?.textContent || 'Телефоны клиник';
    }
    routeLink.href = route?.href || '#contacts';
    routeLink.setAttribute('aria-label', route?.getAttribute('aria-label') || 'Как нас найти');
  }

  function showTimes(times, label, selected = '') {
    time.replaceChildren(new Option(label, ''), ...times.map((value) => new Option(value, value)));
    if (times.includes(selected)) time.value = selected;
    time.disabled = submit.disabled = times.length === 0;
  }

  function loadTimes() {
    const selected = time.value;
    date.disabled = !clinic.value;
    if (!clinic.value) {
      availability.textContent = '';
      showTimes([], 'Выберите филиал');
      return;
    }

    const slots = demoSlots(clinic.value, date.value);
    date.min = slots.minDate;
    date.max = slots.maxDate;
    date.value = slots.date;
    availability.textContent = slots.times.length ? '' : 'На эту дату свободного времени нет. Выберите другую дату.';
    showTimes(slots.times, slots.times.length ? 'Выберите время' : 'Нет свободного времени', selected);
  }

  function resetRequest() {
    const selectedClinic = clinic.value;
    form.reset();
    clinic.value = selectedClinic;
    result.hidden = true;
    description.hidden = form.hidden = false;
  }

  for (const option of branchOptions) {
    option.addEventListener('change', () => {
      if (clinic.value === option.value) return;
      clinic.value = option.value;
      updateBranchLinks();
    });
  }
  updateBranchLinks();
  branchPicker.hidden = false;

  for (const link of document.querySelectorAll('[data-appointment]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      opener = link;
      if (!result.hidden && submittedClinic !== clinic.value) resetRequest();
      appointment.showModal();
      if (!form.hidden && !fields.disabled) loadTimes();
    });
  }
  appointment.addEventListener('close', () => opener?.focus({ preventScroll: true }));

  clinic.addEventListener('change', updateBranchLinks);
  clinic.addEventListener('change', loadTimes);
  date.addEventListener('change', loadTimes);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (fields.disabled || submit.disabled) return;
    submittedClinic = clinic.value;
    const branch = clinic.selectedOptions[0].textContent;
    const visitDate = date.value.split('-').reverse().join('.');
    result.querySelector('.appointment-confirmation').textContent =
      `${branch}, ${visitDate} в ${time.value}.`;
    description.hidden = form.hidden = true;
    result.hidden = false;
    result.focus();
  });

  result.querySelector('.appointment-new').addEventListener('click', () => {
    resetRequest();
    clinic.focus();
    loadTimes();
  });
}

