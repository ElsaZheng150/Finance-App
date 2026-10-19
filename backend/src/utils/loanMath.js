/**
 * Months to pay off a loan with a fixed monthly payment, plus total interest.
 * Returns null if the payment never covers the monthly interest.
 */
function payoff(balance, aprPercent, monthlyPayment) {
  const r = aprPercent / 100 / 12;
  if (balance <= 0) return { months: 0, totalInterest: 0 };
  if (monthlyPayment <= balance * r) return null;

  let months = 0;
  let remaining = balance;
  let totalInterest = 0;
  while (remaining > 0.005 && months < 1200) {
    const interest = remaining * r;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;
  }
  return { months, totalInterest: Math.round(totalInterest * 100) / 100 };
}

module.exports = { payoff };
