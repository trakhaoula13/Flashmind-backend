// Début de la journée de l'utilisateur : envoyé par le navigateur (son fuseau horaire),
// avec repli sur le début de journée du serveur.
function resolveDayStart(clientValue, now = new Date()) {
  if (clientValue) {
    const d = new Date(String(clientValue));
    const age = now.getTime() - d.getTime();
    if (!Number.isNaN(age) && age >= 0 && age <= 36 * 60 * 60 * 1000) return d;
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

module.exports = { resolveDayStart };
