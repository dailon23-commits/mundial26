const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateLabel(value: string) {
  return dateFormatter.format(toDate(value));
}

export function formatTime(value: string) {
  return timeFormatter.format(toDate(value));
}

export function dateKey(value: string) {
  return toDate(value).toISOString().slice(0, 10);
}

function toDate(value: string) {
  return new Date(value.replace(' ', 'T'));
}
