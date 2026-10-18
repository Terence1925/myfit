// Run with: npm run test:prices
// Checks that prices come from the store in the buyer's own currency, and that the saving is worked out from them.
import { describePrices, FALLBACK_PRICES } from '../src/lib/priceLabels'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

const usd = describePrices(
  { price: 3.99, priceString: '$3.99', currencyCode: 'USD' },
  { price: 29.99, priceString: '$29.99', currencyCode: 'USD' },
  'en-US',
)
check('USD source', usd.source, 'store')
check('USD monthly', usd.monthly, '$3.99')
check('USD yearly', usd.yearly, '$29.99')
check('USD per month', usd.yearlyPerMonth, '$2.50')
check('USD saving', usd.savingsAmount, 'Save $17.89 a year')
check('USD percent', usd.savingsPercent, 'Save 37%')

const php = describePrices(
  { price: 199, priceString: '₱199.00', currencyCode: 'PHP' },
  { price: 1790, priceString: '₱1,790.00', currencyCode: 'PHP' },
  'en-PH',
)
check('PHP per month', php.yearlyPerMonth, '₱149.17')
check('PHP saving', php.savingsAmount, 'Save ₱598.00 a year')
check('PHP percent', php.savingsPercent, 'Save 25%')

// Money that has no cents (yen) must not show invented decimals
const jpy = describePrices(
  { price: 600, priceString: '¥600', currencyCode: 'JPY' },
  { price: 4800, priceString: '¥4,800', currencyCode: 'JPY' },
  'en-US',
)
check('JPY has no decimals', jpy.savingsAmount, 'Save ¥2,400 a year')

// No saving, or something missing or mixed up: never show a made-up saving or the wrong currency
const same = describePrices({ price: 5, priceString: '$5.00', currencyCode: 'USD' }, { price: 60, priceString: '$60.00', currencyCode: 'USD' }, 'en-US')
check('no saving when yearly is not cheaper', [same.savingsAmount, same.savingsPercent], [null, null])
check('missing yearly falls back to pesos', describePrices({ price: 3.99, priceString: '$3.99', currencyCode: 'USD' }, null).source, 'fallback')
check('two currencies fall back', describePrices({ price: 3, priceString: '$3', currencyCode: 'USD' }, { price: 30, priceString: '€30', currencyCode: 'EUR' }).source, 'fallback')
check('fallback is the peso price', FALLBACK_PRICES.monthly, '₱199')

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: prices come from the store in the buyer\'s currency, and the saving is worked out from them.')
