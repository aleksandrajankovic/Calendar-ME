// sr latin meseci
const MONTHS_SR = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

export function toSrMonthSlug(year, monthIndex) {
  const name = MONTHS_SR[monthIndex] ?? "mesec";
  return `${name}-${year}`; 
}

export function fromSrMonthSlug(slug) {
  const [monthPart, yearPart] = (slug || "").toLowerCase().split("-");
  const month = MONTHS_SR.indexOf(monthPart);
  const year = Number.parseInt(yearPart, 10);

  if (month === -1 || !Number.isInteger(year)) return null;

  return { year, month };
}
