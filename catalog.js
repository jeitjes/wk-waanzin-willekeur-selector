// Gedeelde catalogus voor badges en trofeeën — gebruikt door de homepage en /admin.
window.KWIM_CATALOGUS = {
  // De emoji-catalogus is leeg: de enige winbare badges zijn de geüploade
  // patch-afbeeldingen (badgeDefs in de state), beheerd via /admin.
  badges: [],
  trofeeen: [
    { id: "gouden-kwim",   emoji: "🏆", naam: "De Gouden Kwim" },
    { id: "zilveren-mango", emoji: "🥭", naam: "De Zilveren Mango" },
    { id: "bronzen-oog",   emoji: "👁️", naam: "Het Bronzen Oog" },
    { id: "gouden-schoen", emoji: "👟", naam: "De Gouden Schoen" },
    { id: "infantino",     emoji: "🎩", naam: "De Infantino Bokaal" },
    { id: "comeback",      emoji: "🔥", naam: "Comeback van het Jaar" },
    { id: "fairplay",      emoji: "🤝", naam: "Fair Play Award" },
    { id: "pollepel",      emoji: "🥄", naam: "De Houten Pollepel" }
  ],
  // emoji-keuze voor eigen trofeeën in het admin-paneel
  emojis: ["🏆", "🥇", "🥈", "🥉", "🍾", "⚽", "🥭", "👁️", "🎖️", "💀", "🦆", "🧨", "🍟", "🚑", "🛎️", "🪩"]
};
