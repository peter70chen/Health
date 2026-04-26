export const downloadJsonFile = (filename: string, data: unknown): void => {
  const file = new File([JSON.stringify(data, null, 2)], filename, { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
