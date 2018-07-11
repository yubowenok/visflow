export const fileSizeDisplay = (size: number): string => {
  const base = 1000;
  if (size < base) {
    return size + 'B';
  } else if (size < base * base) {
    return (size / base).toFixed(2) + 'KB';
  } else {
    return (size / base / base).toFixed(2) + 'MB';
  }
};
