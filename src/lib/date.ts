type DateInput = Date | string;

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function formatShortDate(value: DateInput) {
  return toDate(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function toIsoDate(value: DateInput) {
  return toDate(value).toISOString().split("T")[0];
}
