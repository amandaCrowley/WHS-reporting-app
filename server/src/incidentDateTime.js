export const normalizeIncidentDateTime = (value, fallback = new Date()) => {
  if (value === undefined || value === null || value === '') {
    return new Date(fallback);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(fallback);
  }

  return parsed;
};

export const isIncidentDateTimeValid = (value, reportTime = new Date()) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  const incidentDate = new Date(value);
  if (Number.isNaN(incidentDate.getTime())) {
    return false;
  }

  return incidentDate.getTime() <= new Date(reportTime).getTime();
};
