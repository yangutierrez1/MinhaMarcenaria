export const formatBRL = (value: number) => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrencyInput = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  return Number(cleanValue) / 100;
};