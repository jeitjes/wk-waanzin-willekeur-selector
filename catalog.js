// Gedeelde catalogus voor prijzen en spellen — gebruikt door de homepage, /games en /admin.
window.KWIM_CATALOGUS = {
  // Alle spellen. Een spel is pas zichtbaar op /games als zijn id in
  // state.onthuldeSpellen staat (toggle in /admin) — tot die tijd toont /games
  // een anonieme "nog te onthullen"-kaart, zodat de site gedeeld kan worden
  // zonder de spellen te verklappen. speelbaar=false → wel tonen, nog niet klikbaar.
  spellen: [
    {
      id: "wereldlied",
      naam: "Het Wereldlied",
      icoon: "🎤",
      link: "/wereldlied",
      speelbaar: true,
      omschrijving: "Overschrijf om de beurt het refrein van ANOTR — Talk To You met jullie eigen regels, en zing daarna samen het volkslied van de hele wereld."
    },
    {
      id: "infantino",
      naam: "Secret Infantino",
      icoon: "🕴️",
      link: null,
      speelbaar: false,
      omschrijving: "Nog niet vrijgegeven door de Federatie. Kom later terug."
    }
  ],
  // De vier vaste prijzen: de drie patch-badges plus de Kampioensring.
  // Toekennen/afnemen per team gebeurt via /admin; nieuwe prijzen maken kan niet.
  prijzen: [
    { id: "fairplay",      naam: "Fair Play",        afbeelding: "/prijs-fairplay.webp" },
    { id: "flairplay",     naam: "Flair Play",       afbeelding: "/prijs-flairplay.webp" },
    { id: "legacy",        naam: "Legacy",           afbeelding: "/prijs-legacy.webp" },
    { id: "kampioensring", naam: "De Kampioensring", afbeelding: "/kampioensring.svg" }
  ],
  // landen (ISO 3166-1 alpha-2) waaruit een team een vlag kan kiezen
  landen: [
    { code: "AF", naam: "Afghanistan" }, { code: "AL", naam: "Albanië" }, { code: "DZ", naam: "Algerije" },
    { code: "AD", naam: "Andorra" }, { code: "AO", naam: "Angola" }, { code: "AG", naam: "Antigua en Barbuda" },
    { code: "AR", naam: "Argentinië" }, { code: "AM", naam: "Armenië" }, { code: "AU", naam: "Australië" },
    { code: "AT", naam: "Oostenrijk" }, { code: "AZ", naam: "Azerbeidzjan" }, { code: "BS", naam: "Bahama's" },
    { code: "BH", naam: "Bahrein" }, { code: "BD", naam: "Bangladesh" }, { code: "BB", naam: "Barbados" },
    { code: "BY", naam: "Wit-Rusland" }, { code: "BE", naam: "België" }, { code: "BZ", naam: "Belize" },
    { code: "BJ", naam: "Benin" }, { code: "BT", naam: "Bhutan" }, { code: "BO", naam: "Bolivia" },
    { code: "BA", naam: "Bosnië en Herzegovina" }, { code: "BW", naam: "Botswana" }, { code: "BR", naam: "Brazilië" },
    { code: "BN", naam: "Brunei" }, { code: "BG", naam: "Bulgarije" }, { code: "BF", naam: "Burkina Faso" },
    { code: "BI", naam: "Burundi" }, { code: "KH", naam: "Cambodja" }, { code: "CM", naam: "Kameroen" },
    { code: "CA", naam: "Canada" }, { code: "CV", naam: "Kaapverdië" }, { code: "CF", naam: "Centraal-Afrikaanse Republiek" },
    { code: "TD", naam: "Tsjaad" }, { code: "CL", naam: "Chili" }, { code: "CN", naam: "China" },
    { code: "CO", naam: "Colombia" }, { code: "KM", naam: "Comoren" }, { code: "CG", naam: "Congo-Brazzaville" },
    { code: "CD", naam: "Congo-Kinshasa" }, { code: "CR", naam: "Costa Rica" }, { code: "CI", naam: "Ivoorkust" },
    { code: "HR", naam: "Kroatië" }, { code: "CU", naam: "Cuba" }, { code: "CY", naam: "Cyprus" },
    { code: "CZ", naam: "Tsjechië" }, { code: "DK", naam: "Denemarken" }, { code: "DJ", naam: "Djibouti" },
    { code: "DM", naam: "Dominica" }, { code: "DO", naam: "Dominicaanse Republiek" }, { code: "EC", naam: "Ecuador" },
    { code: "EG", naam: "Egypte" }, { code: "SV", naam: "El Salvador" }, { code: "GQ", naam: "Equatoriaal-Guinea" },
    { code: "ER", naam: "Eritrea" }, { code: "EE", naam: "Estland" }, { code: "SZ", naam: "Eswatini" },
    { code: "ET", naam: "Ethiopië" }, { code: "FJ", naam: "Fiji" }, { code: "FI", naam: "Finland" },
    { code: "FR", naam: "Frankrijk" }, { code: "GA", naam: "Gabon" }, { code: "GM", naam: "Gambia" },
    { code: "GE", naam: "Georgië" }, { code: "DE", naam: "Duitsland" }, { code: "GH", naam: "Ghana" },
    { code: "GR", naam: "Griekenland" }, { code: "GD", naam: "Grenada" }, { code: "GT", naam: "Guatemala" },
    { code: "GN", naam: "Guinee" }, { code: "GW", naam: "Guinee-Bissau" }, { code: "GY", naam: "Guyana" },
    { code: "HT", naam: "Haïti" }, { code: "HN", naam: "Honduras" }, { code: "HU", naam: "Hongarije" },
    { code: "IS", naam: "IJsland" }, { code: "IN", naam: "India" }, { code: "ID", naam: "Indonesië" },
    { code: "IR", naam: "Iran" }, { code: "IQ", naam: "Irak" }, { code: "IE", naam: "Ierland" },
    { code: "IL", naam: "Israël" }, { code: "IT", naam: "Italië" }, { code: "JM", naam: "Jamaica" },
    { code: "JP", naam: "Japan" }, { code: "JO", naam: "Jordanië" }, { code: "KZ", naam: "Kazachstan" },
    { code: "KE", naam: "Kenia" }, { code: "KI", naam: "Kiribati" }, { code: "KP", naam: "Noord-Korea" },
    { code: "KR", naam: "Zuid-Korea" }, { code: "KW", naam: "Koeweit" }, { code: "KG", naam: "Kirgizië" },
    { code: "LA", naam: "Laos" }, { code: "LV", naam: "Letland" }, { code: "LB", naam: "Libanon" },
    { code: "LS", naam: "Lesotho" }, { code: "LR", naam: "Liberia" }, { code: "LY", naam: "Libië" },
    { code: "LI", naam: "Liechtenstein" }, { code: "LT", naam: "Litouwen" }, { code: "LU", naam: "Luxemburg" },
    { code: "MG", naam: "Madagaskar" }, { code: "MW", naam: "Malawi" }, { code: "MY", naam: "Maleisië" },
    { code: "MV", naam: "Maldiven" }, { code: "ML", naam: "Mali" }, { code: "MT", naam: "Malta" },
    { code: "MH", naam: "Marshalleilanden" }, { code: "MR", naam: "Mauritanië" }, { code: "MU", naam: "Mauritius" },
    { code: "MX", naam: "Mexico" }, { code: "FM", naam: "Micronesië" }, { code: "MD", naam: "Moldavië" },
    { code: "MC", naam: "Monaco" }, { code: "MN", naam: "Mongolië" }, { code: "ME", naam: "Montenegro" },
    { code: "MA", naam: "Marokko" }, { code: "MZ", naam: "Mozambique" }, { code: "MM", naam: "Myanmar" },
    { code: "NA", naam: "Namibië" }, { code: "NR", naam: "Nauru" }, { code: "NP", naam: "Nepal" },
    { code: "NL", naam: "Nederland" }, { code: "NZ", naam: "Nieuw-Zeeland" }, { code: "NI", naam: "Nicaragua" },
    { code: "NE", naam: "Niger" }, { code: "NG", naam: "Nigeria" }, { code: "MK", naam: "Noord-Macedonië" },
    { code: "NO", naam: "Noorwegen" }, { code: "OM", naam: "Oman" }, { code: "PK", naam: "Pakistan" },
    { code: "PW", naam: "Palau" }, { code: "PS", naam: "Palestina" }, { code: "PA", naam: "Panama" },
    { code: "PG", naam: "Papoea-Nieuw-Guinea" }, { code: "PY", naam: "Paraguay" }, { code: "PE", naam: "Peru" },
    { code: "PH", naam: "Filipijnen" }, { code: "PL", naam: "Polen" }, { code: "PT", naam: "Portugal" },
    { code: "QA", naam: "Qatar" }, { code: "RO", naam: "Roemenië" }, { code: "RU", naam: "Rusland" },
    { code: "RW", naam: "Rwanda" }, { code: "KN", naam: "Saint Kitts en Nevis" }, { code: "LC", naam: "Saint Lucia" },
    { code: "VC", naam: "Saint Vincent en de Grenadines" }, { code: "WS", naam: "Samoa" }, { code: "SM", naam: "San Marino" },
    { code: "ST", naam: "Sao Tomé en Principe" }, { code: "SA", naam: "Saoedi-Arabië" }, { code: "SN", naam: "Senegal" },
    { code: "RS", naam: "Servië" }, { code: "SC", naam: "Seychellen" }, { code: "SL", naam: "Sierra Leone" },
    { code: "SG", naam: "Singapore" }, { code: "SK", naam: "Slowakije" }, { code: "SI", naam: "Slovenië" },
    { code: "SB", naam: "Salomonseilanden" }, { code: "SO", naam: "Somalië" }, { code: "ZA", naam: "Zuid-Afrika" },
    { code: "SS", naam: "Zuid-Soedan" }, { code: "ES", naam: "Spanje" }, { code: "LK", naam: "Sri Lanka" },
    { code: "SD", naam: "Soedan" }, { code: "SR", naam: "Suriname" }, { code: "SE", naam: "Zweden" },
    { code: "CH", naam: "Zwitserland" }, { code: "SY", naam: "Syrië" }, { code: "TW", naam: "Taiwan" },
    { code: "TJ", naam: "Tadzjikistan" }, { code: "TZ", naam: "Tanzania" }, { code: "TH", naam: "Thailand" },
    { code: "TL", naam: "Oost-Timor" }, { code: "TG", naam: "Togo" }, { code: "TO", naam: "Tonga" },
    { code: "TT", naam: "Trinidad en Tobago" }, { code: "TN", naam: "Tunesië" }, { code: "TR", naam: "Turkije" },
    { code: "TM", naam: "Turkmenistan" }, { code: "TV", naam: "Tuvalu" }, { code: "UG", naam: "Oeganda" },
    { code: "UA", naam: "Oekraïne" }, { code: "AE", naam: "Verenigde Arabische Emiraten" }, { code: "GB", naam: "Verenigd Koninkrijk" },
    { code: "US", naam: "Verenigde Staten" }, { code: "UY", naam: "Uruguay" }, { code: "UZ", naam: "Oezbekistan" },
    { code: "VU", naam: "Vanuatu" }, { code: "VA", naam: "Vaticaanstad" }, { code: "VE", naam: "Venezuela" },
    { code: "VN", naam: "Vietnam" }, { code: "YE", naam: "Jemen" }, { code: "ZM", naam: "Zambia" },
    { code: "ZW", naam: "Zimbabwe" }, { code: "XK", naam: "Kosovo" }
  ]
};

// zet een ISO 3166-1 alpha-2 code om in een vlagemoji (regional indicator symbols)
window.KWIM_VLAG = function vlagEmoji(code) {
  if (!code || typeof code !== "string" || !/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
};
