export function validateName(value, label = "Name") {
  if (typeof value !== "string" || value.trim().length < 2) {
    return `${label} must be at least 2 characters.`;
  }
  if (value.trim().length > 50) return `${label} must be no more than 50 characters.`;
  if (!/^[\p{L}\p{M} '\u2019-]+$/u.test(value.trim()) || !/\p{L}/u.test(value)) {
    return `${label} can only contain letters, spaces, hyphens and apostrophes.`;
  }
  return "";
}

export function isValidCoordinates(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
    && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
