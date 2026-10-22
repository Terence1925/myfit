// Run with: npm run test:recent-searches
// Checks the "recent searches" list under the food search box.
import { MAX_RECENT_SEARCHES, withSearch } from '../src/lib/foods/recentSearches'

const problems: string[] = []
const check = (label: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
}

check('a new search goes first', withSearch(['rice', 'egg'], 'banana'), ['banana', 'rice', 'egg'])
check('a repeat moves to the front, once', withSearch(['rice', 'egg', 'banana'], 'egg'), ['egg', 'rice', 'banana'])
check('capitals do not make a second copy', withSearch(['Chicken breast'], 'chicken BREAST'), ['chicken BREAST'])
check('spaces are tidied', withSearch([], '  fried    egg '), ['fried egg'])
check('one letter is ignored', withSearch(['rice'], 'a'), ['rice'])
check('empty is ignored', withSearch(['rice'], '   '), ['rice'])
check('the list stops at 8', withSearch(['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a'], 'new').length, MAX_RECENT_SEARCHES)
check('the oldest one drops off', withSearch(['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a'], 'new').includes('8a'), false)

if (problems.length) {
  console.log('FAILED')
  for (const p of problems) console.log(' - ' + p)
  process.exit(1)
}
console.log('PASSED: recent searches keep the newest first, without repeats, up to 8.')
