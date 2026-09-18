export type ServiceDateTimeParseResult =
  | { date: Date; error: null }
  | { date: null; error: "invalid" | "nonexistent" | "ambiguous" };

const partsFor = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

const localKey = (parts: Record<string, string>) =>
  `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;

const offsetAt = (date: Date, timeZone: string) => {
  const parts = partsFor(date, timeZone);
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  ) - date.getTime();
};

const parseParts = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2})[:.](\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const wallClock = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
  const check = new Date(wallClock);
  if (
    check.getUTCFullYear() !== Number(year) ||
    check.getUTCMonth() + 1 !== Number(month) ||
    check.getUTCDate() !== Number(day) ||
    check.getUTCHours() !== Number(hour) ||
    check.getUTCMinutes() !== Number(minute)
  ) return null;
  return { year, month, day, hour, minute, wallClock, key: `${year}-${month}-${day}T${hour}:${minute}:00` };
};

export const parseServiceDateTime = (value: string, timeZone: string): ServiceDateTimeParseResult => {
  if (!timeZone) return { date: null, error: "invalid" };
  const parsed = parseParts(value);
  if (!parsed) return { date: null, error: "invalid" };
  const offsets = new Set<number>();
  // Sample a broad window around the wall-clock value so both offsets are
  // considered during fall-back transitions, including zones with unusual
  // historical or half-hour changes.
  for (let delta = -36; delta <= 36; delta += 1) {
    offsets.add(offsetAt(new Date(parsed.wallClock + delta * 60 * 60 * 1000), timeZone));
  }
  const candidates = [...offsets]
    .map((offset) => new Date(parsed.wallClock - offset))
    .filter((candidate) => localKey(partsFor(candidate, timeZone)) === parsed.key);
  if (candidates.length === 0) return { date: null, error: "nonexistent" };
  if (candidates.length > 1) return { date: null, error: "ambiguous" };
  return { date: candidates[0], error: null };
};

export const formatServiceDateTimeInput = (value: string, timeZone: string) => {
  if (!timeZone) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = partsFor(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const formatServiceTypedDateTime = (value: string, timeZone: string) => {
  if (!timeZone) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = partsFor(date, timeZone);
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}.${parts.minute}`;
};
