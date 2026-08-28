// Weighted random pick over whatever prize list is passed in (loaded fresh
// from the database on every call site — never hardcoded), so odds always
// reflect whatever the admin most recently saved.
function pickPrizeIndex(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    roll -= prizes[i].weight;
    if (roll <= 0) return i;
  }
  return prizes.length - 1;
}

module.exports = { pickPrizeIndex };
