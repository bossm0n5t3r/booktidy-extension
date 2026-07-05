export const normalizeText = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

export const matchContains = (target: string, pattern: string): boolean => {
  const normalizedPattern = normalizeText(pattern);

  if (normalizedPattern.length === 0) {
    return false;
  }

  return normalizeText(target).includes(normalizedPattern);
};
