/**
 * Règles de révision FlashMind (différentes d'Anki : la carte reste toujours
 * dans la liste, seule la date de retour change).
 *
 *  again  (À revoir)   -> revient après 3 ou 4 cartes (géré dans la session côté client,
 *                         côté base la carte reste due immédiatement)
 *  hard   (Difficile)  -> revient dans 10 minutes
 *  medium (Moyen)      -> revient à la fin de la journée
 *  easy   (Facile)     -> revient dans plusieurs jours (4 j, puis x2.5 à chaque succès)
 */
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const HARD_DELAY_MIN = 10;
const FIRST_EASY_DAYS = 4;
const EASY_FACTOR = 2.5;

function serverEndOfDay(now) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Le navigateur envoie la fin de SA journée (fuseau de l'utilisateur).
function resolveEndOfDay(now, clientValue) {
  if (clientValue) {
    const d = new Date(clientValue);
    const ms = d.getTime() - now.getTime();
    if (!Number.isNaN(ms) && ms > 0 && ms <= 36 * 60 * MINUTE) return d;
  }
  return serverEndOfDay(now);
}

function schedule(card, rating, now = new Date(), clientEndOfDay) {
  let intervalDays = card.intervalDays || 0;
  let dueAt;

  switch (rating) {
    case 'easy':
      intervalDays = intervalDays >= 1 ? Math.ceil(intervalDays * EASY_FACTOR) : FIRST_EASY_DAYS;
      dueAt = new Date(now.getTime() + intervalDays * DAY);
      break;
    case 'medium':
      dueAt = resolveEndOfDay(now, clientEndOfDay);
      break;
    case 'hard':
      intervalDays = Math.floor(intervalDays / 2);
      dueAt = new Date(now.getTime() + HARD_DELAY_MIN * MINUTE);
      break;
    case 'again':
    default:
      intervalDays = 0;
      dueAt = new Date(now.getTime());
      break;
  }
  return { dueAt, intervalDays };
}

module.exports = { schedule, HARD_DELAY_MIN, FIRST_EASY_DAYS, EASY_FACTOR };
