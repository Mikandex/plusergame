const currencySymbols: Record<string, string> = {
  NGN: "₦",
  GBP: "£",
};

const displayCurrency = (number: number, currency: "GBP" | "NGN" = "NGN") => {
  const num = Number(number);

  if (typeof num !== "number" || isNaN(num)) {
    return `${currencySymbols[currency]}0.00`; // fallback
  }

  let locale = "en-GB";
  let curr = currency;

  if (currency === "NGN") {
    locale = "en-NG"; // Nigerian English locale
    curr = "NGN";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default displayCurrency;
