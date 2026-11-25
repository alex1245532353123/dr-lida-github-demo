const clinicDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Yekaterinburg' });
const demoTimes = ['10:00', '10:30', '14:00', '14:30'];

export function demoSlots(clinic, requestedDate, now = new Date()) {
  const minDate = clinicDate.format(now);
  const lastDay = new Date(`${minDate}T00:00:00Z`);
  lastDay.setUTCDate(lastDay.getUTCDate() + 30);
  const maxDate = lastDay.toISOString().slice(0, 10);
  const date = requestedDate >= minDate && requestedDate <= maxDate ? requestedDate : minDate;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const closed = weekday === 0 || (weekday === 6 && clinic === 'sorochinsk');
  return { date, minDate, maxDate, times: closed ? [] : demoTimes };
}

