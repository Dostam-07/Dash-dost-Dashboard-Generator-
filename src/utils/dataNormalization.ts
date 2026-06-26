interface CountryRecord {
  name: string;
  alpha2: string;
  alpha3: string;
  aliases: string[];
}

export const COUNTRIES_DB: CountryRecord[] = [
  { name: "Afghanistan", alpha2: "AF", alpha3: "AFG", aliases: ["Islamic Republic of Afghanistan"] },
  { name: "Albania", alpha2: "AL", alpha3: "ALB", aliases: [] },
  { name: "Algeria", alpha2: "DZ", alpha3: "DZA", aliases: [] },
  { name: "Andorra", alpha2: "AD", alpha3: "AND", aliases: [] },
  { name: "Angola", alpha2: "AO", alpha3: "AGO", aliases: [] },
  { name: "Antarctica", alpha2: "AQ", alpha3: "ATA", aliases: [] },
  { name: "Argentina", alpha2: "AR", alpha3: "ARG", aliases: [] },
  { name: "Armenia", alpha2: "AM", alpha3: "ARM", aliases: [] },
  { name: "Australia", alpha2: "AU", alpha3: "AUS", aliases: [] },
  { name: "Austria", alpha2: "AT", alpha3: "AUT", aliases: [] },
  { name: "Azerbaijan", alpha2: "AZ", alpha3: "AZE", aliases: [] },
  { name: "Bahamas", alpha2: "BS", alpha3: "BHS", aliases: ["The Bahamas"] },
  { name: "Bahrain", alpha2: "BH", alpha3: "BHR", aliases: [] },
  { name: "Bangladesh", alpha2: "BD", alpha3: "BGD", aliases: [] },
  { name: "Barbados", alpha2: "BB", alpha3: "BRB", aliases: [] },
  { name: "Belarus", alpha2: "BY", alpha3: "BLR", aliases: [] },
  { name: "Belgium", alpha2: "BE", alpha3: "BEL", aliases: [] },
  { name: "Belize", alpha2: "BZ", alpha3: "BLZ", aliases: [] },
  { name: "Benin", alpha2: "BJ", alpha3: "BEN", aliases: [] },
  { name: "Bhutan", alpha2: "BT", alpha3: "BTN", aliases: [] },
  { name: "Bolivia", alpha2: "BO", alpha3: "BOL", aliases: ["Bolivia (Plurinational State of)"] },
  { name: "Bosnia and Herz.", alpha2: "BA", alpha3: "BIH", aliases: ["Bosnia and Herzegovina", "Bosnia", "Herzegovina", "Bosnia & Herzegovina"] },
  { name: "Botswana", alpha2: "BW", alpha3: "BWA", aliases: [] },
  { name: "Brazil", alpha2: "BR", alpha3: "BRA", aliases: ["Brasil"] },
  { name: "Brunei", alpha2: "BN", alpha3: "BRN", aliases: ["Brunei Darussalam"] },
  { name: "Bulgaria", alpha2: "BG", alpha3: "BGR", aliases: [] },
  { name: "Burkina Faso", alpha2: "BF", alpha3: "BFA", aliases: [] },
  { name: "Burundi", alpha2: "BI", alpha3: "BDI", aliases: [] },
  { name: "Cambodia", alpha2: "KH", alpha3: "KHM", aliases: [] },
  { name: "Cameroon", alpha2: "CM", alpha3: "CMR", aliases: [] },
  { name: "Canada", alpha2: "CA", alpha3: "CAN", aliases: [] },
  { name: "Central African Rep.", alpha2: "CF", alpha3: "CAF", aliases: ["Central African Republic"] },
  { name: "Chad", alpha2: "TD", alpha3: "TCD", aliases: [] },
  { name: "Chile", alpha2: "CL", alpha3: "CHL", aliases: [] },
  { name: "China", alpha2: "CN", alpha3: "CHN", aliases: ["PRC", "People's Republic of China"] },
  { name: "Colombia", alpha2: "CO", alpha3: "COL", aliases: [] },
  { name: "Congo", alpha2: "CG", alpha3: "COG", aliases: ["Republic of the Congo", "Congo-Brazzaville"] },
  { name: "Dem. Rep. Congo", alpha2: "CD", alpha3: "COD", aliases: ["Democratic Republic of the Congo", "DRC", "Zaire", "Congo-Kinshasa"] },
  { name: "Costa Rica", alpha2: "CR", alpha3: "CRI", aliases: [] },
  { name: "Croatia", alpha2: "HR", alpha3: "HRV", aliases: [] },
  { name: "Cuba", alpha2: "CU", alpha3: "CUB", aliases: [] },
  { name: "Cyprus", alpha2: "CY", alpha3: "CYP", aliases: [] },
  { name: "Czech Rep.", alpha2: "CZ", alpha3: "CZE", aliases: ["Czech Republic", "Czechia"] },
  { name: "Denmark", alpha2: "DK", alpha3: "DNK", aliases: [] },
  { name: "Djibouti", alpha2: "DJ", alpha3: "DJI", aliases: [] },
  { name: "Dominican Rep.", alpha2: "DO", alpha3: "DOM", aliases: ["Dominican Republic"] },
  { name: "Ecuador", alpha2: "EC", alpha3: "ECU", aliases: [] },
  { name: "Egypt", alpha2: "EG", alpha3: "EGY", aliases: [] },
  { name: "El Salvador", alpha2: "SV", alpha3: "SLV", aliases: [] },
  { name: "Equatorial Guinea", alpha2: "GQ", alpha3: "GNQ", aliases: [] },
  { name: "Eritrea", alpha2: "ER", alpha3: "ERI", aliases: [] },
  { name: "Estonia", alpha2: "EE", alpha3: "EST", aliases: [] },
  { name: "Ethiopia", alpha2: "ET", alpha3: "ETH", aliases: [] },
  { name: "Fiji", alpha2: "FJ", alpha3: "FJI", aliases: [] },
  { name: "Finland", alpha2: "FI", alpha3: "FIN", aliases: [] },
  { name: "France", alpha2: "FR", alpha3: "FRA", aliases: [] },
  { name: "Gabon", alpha2: "GA", alpha3: "GAB", aliases: [] },
  { name: "Gambia", alpha2: "GM", alpha3: "GMB", aliases: ["The Gambia"] },
  { name: "Georgia", alpha2: "GE", alpha3: "GEO", aliases: [] },
  { name: "Germany", alpha2: "DE", alpha3: "DEU", aliases: ["Deutschland", "FRG"] },
  { name: "Ghana", alpha2: "GH", alpha3: "GHA", aliases: [] },
  { name: "Greece", alpha2: "GR", alpha3: "GRC", aliases: [] },
  { name: "Greenland", alpha2: "GL", alpha3: "GRL", aliases: [] },
  { name: "Guatemala", alpha2: "GT", alpha3: "GTM", aliases: [] },
  { name: "Guinea", alpha2: "GN", alpha3: "GIN", aliases: [] },
  { name: "Guyana", alpha2: "GY", alpha3: "GUY", aliases: [] },
  { name: "Haiti", alpha2: "HT", alpha3: "HTI", aliases: [] },
  { name: "Honduras", alpha2: "HN", alpha3: "HND", aliases: [] },
  { name: "Hungary", alpha2: "HU", alpha3: "HUN", aliases: [] },
  { name: "Iceland", alpha2: "IS", alpha3: "ISL", aliases: [] },
  { name: "India", alpha2: "IN", alpha3: "IND", aliases: [] },
  { name: "Indonesia", alpha2: "ID", alpha3: "IDN", aliases: [] },
  { name: "Iran", alpha2: "IR", alpha3: "IRN", aliases: ["Islamic Republic of Iran", "Iran (Islamic Republic of)"] },
  { name: "Iraq", alpha2: "IQ", alpha3: "IRQ", aliases: [] },
  { name: "Ireland", alpha2: "IE", alpha3: "IRL", aliases: ["Republic of Ireland", "Eire"] },
  { name: "Israel", alpha2: "IL", alpha3: "ISR", aliases: [] },
  { name: "Italy", alpha2: "IT", alpha3: "ITA", aliases: [] },
  { name: "Jamaica", alpha2: "JM", alpha3: "JAM", aliases: [] },
  { name: "Japan", alpha2: "JP", alpha3: "JPN", aliases: [] },
  { name: "Jordan", alpha2: "JO", alpha3: "JOR", aliases: [] },
  { name: "Kazakhstan", alpha2: "KZ", alpha3: "KAZ", aliases: [] },
  { name: "Kenya", alpha2: "KE", alpha3: "KEN", aliases: [] },
  { name: "Korea", alpha2: "KR", alpha3: "KOR", aliases: ["South Korea", "Republic of Korea", "S. Korea"] },
  { name: "Dem. Rep. Korea", alpha2: "KP", alpha3: "PRK", aliases: ["North Korea", "Democratic People's Republic of Korea", "N. Korea"] },
  { name: "Kuwait", alpha2: "KW", alpha3: "KWT", aliases: [] },
  { name: "Kyrgyzstan", alpha2: "KG", alpha3: "KGZ", aliases: [] },
  { name: "Laos", alpha2: "LA", alpha3: "LAO", aliases: ["Lao People's Democratic Republic"] },
  { name: "Latvia", alpha2: "LV", alpha3: "LVA", aliases: [] },
  { name: "Lebanon", alpha2: "LB", alpha3: "LBN", aliases: [] },
  { name: "Lesotho", alpha2: "LS", alpha3: "LSO", aliases: [] },
  { name: "Liberia", alpha2: "LR", alpha3: "LBR", aliases: [] },
  { name: "Libya", alpha2: "LY", alpha3: "LBY", aliases: [] },
  { name: "Lithuania", alpha2: "LT", alpha3: "LTU", aliases: [] },
  { name: "Luxembourg", alpha2: "LU", alpha3: "LUX", aliases: [] },
  { name: "Macedonia", alpha2: "MK", alpha3: "MKD", aliases: ["North Macedonia", "F.Y.R.O.M.", "Macedonia (the former Yugoslav Republic of)"] },
  { name: "Madagascar", alpha2: "MG", alpha3: "MDG", aliases: [] },
  { name: "Malawi", alpha2: "MW", alpha3: "MWI", aliases: [] },
  { name: "Malaysia", alpha2: "MY", alpha3: "MYS", aliases: [] },
  { name: "Mali", alpha2: "ML", alpha3: "MLI", aliases: [] },
  { name: "Mauritania", alpha2: "MR", alpha3: "MRT", aliases: [] },
  { name: "Mexico", alpha2: "MX", alpha3: "MEX", aliases: [] },
  { name: "Moldova", alpha2: "MD", alpha3: "MDA", aliases: ["Republic of Moldova", "Moldova (Republic of)"] },
  { name: "Mongolia", alpha2: "MN", alpha3: "MNG", aliases: [] },
  { name: "Montenegro", alpha2: "ME", alpha3: "MNE", aliases: [] },
  { name: "Morocco", alpha2: "MA", alpha3: "MAR", aliases: [] },
  { name: "Mozambique", alpha2: "MZ", alpha3: "MOZ", aliases: [] },
  { name: "Myanmar", alpha2: "MM", alpha3: "MMR", aliases: ["Burma"] },
  { name: "Namibia", alpha2: "NA", alpha3: "NAM", aliases: [] },
  { name: "Nepal", alpha2: "NP", alpha3: "NPL", aliases: [] },
  { name: "Netherlands", alpha2: "NL", alpha3: "NLD", aliases: ["Holland", "Kingdom of the Netherlands"] },
  { name: "New Zealand", alpha2: "NZ", alpha3: "NZL", aliases: ["Aotearoa", "NZ"] },
  { name: "Nicaragua", alpha2: "NI", alpha3: "NIC", aliases: [] },
  { name: "Niger", alpha2: "NE", alpha3: "NER", aliases: [] },
  { name: "Nigeria", alpha2: "NG", alpha3: "NGA", aliases: [] },
  { name: "Norway", alpha2: "NO", alpha3: "NOR", aliases: [] },
  { name: "Oman", alpha2: "OM", alpha3: "OMN", aliases: [] },
  { name: "Pakistan", alpha2: "PK", alpha3: "PAK", aliases: [] },
  { name: "Panama", alpha2: "PA", alpha3: "PAN", aliases: [] },
  { name: "Papua New Guinea", alpha2: "PG", alpha3: "PNG", aliases: [] },
  { name: "Paraguay", alpha2: "PY", alpha3: "PRY", aliases: [] },
  { name: "Peru", alpha2: "PE", alpha3: "PER", aliases: [] },
  { name: "Philippines", alpha2: "PH", alpha3: "PHL", aliases: [] },
  { name: "Poland", alpha2: "PL", alpha3: "POL", aliases: [] },
  { name: "Portugal", alpha2: "PT", alpha3: "PRT", aliases: [] },
  { name: "Puerto Rico", alpha2: "PR", alpha3: "PRI", aliases: [] },
  { name: "Qatar", alpha2: "QA", alpha3: "QAT", aliases: [] },
  { name: "Romania", alpha2: "RO", alpha3: "ROU", aliases: [] },
  { name: "Russia", alpha2: "RU", alpha3: "RUS", aliases: ["Russian Federation", "RF"] },
  { name: "Rwanda", alpha2: "RW", alpha3: "RWA", aliases: [] },
  { name: "Saudi Arabia", alpha2: "SA", alpha3: "SAU", aliases: [] },
  { name: "Senegal", alpha2: "SN", alpha3: "SEN", aliases: [] },
  { name: "Serbia", alpha2: "RS", alpha3: "SRB", aliases: [] },
  { name: "Sierra Leone", alpha2: "SL", alpha3: "SLE", aliases: [] },
  { name: "Singapore", alpha2: "SG", alpha3: "SGP", aliases: [] },
  { name: "Slovakia", alpha2: "SK", alpha3: "SVK", aliases: ["Slovak Republic"] },
  { name: "Slovenia", alpha2: "SI", alpha3: "SVN", aliases: [] },
  { name: "Solomon Is.", alpha2: "SB", alpha3: "SLB", aliases: ["Solomon Islands"] },
  { name: "Somalia", alpha2: "SO", alpha3: "SOM", aliases: [] },
  { name: "South Africa", alpha2: "ZA", alpha3: "ZAF", aliases: ["RSA", "Zuid-Afrika"] },
  { name: "S. Sudan", alpha2: "SS", alpha3: "SSD", aliases: ["South Sudan"] },
  { name: "Spain", alpha2: "ES", alpha3: "ESP", aliases: ["Espana", "España"] },
  { name: "Sri Lanka", alpha2: "LK", alpha3: "LKA", aliases: [] },
  { name: "Sudan", alpha2: "SD", alpha3: "SDN", aliases: [] },
  { name: "Suriname", alpha2: "SR", alpha3: "SUR", aliases: [] },
  { name: "Sweden", alpha2: "SE", alpha3: "SWE", aliases: [] },
  { name: "Switzerland", alpha2: "CH", alpha3: "CHE", aliases: ["Confoederatio Helvetica"] },
  { name: "Syria", alpha2: "SY", alpha3: "SYR", aliases: ["Syrian Arab Republic"] },
  { name: "Taiwan", alpha2: "TW", alpha3: "TWN", aliases: ["Taiwan, Province of China", "Republic of China", "ROC"] },
  { name: "Tajikistan", alpha2: "TJ", alpha3: "TJK", aliases: [] },
  { name: "Tanzania", alpha2: "TZ", alpha3: "TZA", aliases: ["United Republic of Tanzania"] },
  { name: "Thailand", alpha2: "TH", alpha3: "THA", aliases: [] },
  { name: "Timor-Leste", alpha2: "TL", alpha3: "TLS", aliases: ["East Timor"] },
  { name: "Togo", alpha2: "TG", alpha3: "TGO", aliases: [] },
  { name: "Trinidad and Tobago", alpha2: "TT", alpha3: "TTO", aliases: ["Trinidad"] },
  { name: "Tunisia", alpha2: "TN", alpha3: "TUN", aliases: [] },
  { name: "Turkey", alpha2: "TR", alpha3: "TUR", aliases: ["Türkiye", "Republic of Turkey"] },
  { name: "Turkmenistan", alpha2: "TM", alpha3: "TKM", aliases: [] },
  { name: "Uganda", alpha2: "UG", alpha3: "UGA", aliases: [] },
  { name: "Ukraine", alpha2: "UA", alpha3: "UKR", aliases: [] },
  { name: "United Arab Emirates", alpha2: "AE", alpha3: "ARE", aliases: ["UAE", "Emirates"] },
  { name: "United Kingdom", alpha2: "GB", alpha3: "GBR", aliases: ["UK", "Great Britain", "U.K.", "Britain"] },
  { name: "United States", alpha2: "US", alpha3: "USA", aliases: ["United States of America", "U.S.", "U.S.A.", "US of A", "America"] },
  { name: "Uruguay", alpha2: "UY", alpha3: "URY", aliases: [] },
  { name: "Uzbekistan", alpha2: "UZ", alpha3: "UZB", aliases: [] },
  { name: "Vanuatu", alpha2: "VU", alpha3: "VUT", aliases: [] },
  { name: "Venezuela", alpha2: "VE", alpha3: "VEN", aliases: ["Bolivarian Republic of Venezuela", "Venezuela (Bolivarian Republic of)"] },
  { name: "Vietnam", alpha2: "VN", alpha3: "VNM", aliases: ["Viet Nam"] },
  { name: "W. Sahara", alpha2: "EH", alpha3: "ESH", aliases: ["Western Sahara"] },
  { name: "Yemen", alpha2: "YE", alpha3: "YEM", aliases: [] },
  { name: "Zambia", alpha2: "ZM", alpha3: "ZMB", aliases: [] },
  { name: "Zimbabwe", alpha2: "ZW", alpha3: "ZWE", aliases: [] }
];

export const normalizeToPrimaryName = (rawStr: string): string => {
  if (!rawStr || typeof rawStr !== 'string') return '';
  const search = rawStr.trim().toUpperCase();
  if (!search) return '';

  // 1. Literal exact matches first
  for (const c of COUNTRIES_DB) {
    if (c.name.toUpperCase() === search || c.alpha2 === search || c.alpha3 === search) {
      return c.name;
    }
  }

  // 2. Fuzzy matches against aliases (case insensitive, trimmed, ignoring common dots etc)
  const cleanedSearch = search.replace(/\./g, '').trim();
  for (const c of COUNTRIES_DB) {
    if (c.name.replace(/\./g, '').toUpperCase() === cleanedSearch ||
        c.alpha2 === cleanedSearch ||
        c.alpha3 === cleanedSearch) {
      return c.name;
    }
    const matchAlias = c.aliases.some(alias => {
      const cleanedAlias = alias.replace(/\./g, '').toUpperCase().trim();
      return cleanedAlias === cleanedSearch || cleanedAlias.includes(cleanedSearch) || cleanedSearch.includes(cleanedAlias);
    });
    if (matchAlias) {
      return c.name;
    }
  }

  // 3. Last resort fallback substring match on primary name
  for (const c of COUNTRIES_DB) {
    const cNameUpper = c.name.toUpperCase();
    if (cNameUpper.includes(search) || search.includes(cNameUpper)) {
      return c.name;
    }
  }

  // Convert raw value to a nicer capitalized form if nothing fits
  return rawStr;
};

export const normalizeGeoData = (data: any[], key: string) => {
  if (!data || !Array.isArray(data)) return [];
  
  let finalKey = key;
  if (data.length > 0) {
    const sample = data[0] || {};
    const keys = Object.keys(sample);
    if (sample[key] === undefined || sample[key] === null) {
      const geoTerms = ['country', 'region', 'state', 'city', 'territory', 'nation', 'location', 'geo', 'province', 'district', 'continent'];
      const matchedKey = keys.find(k => {
        const lowerK = k.toLowerCase();
        return geoTerms.some(term => lowerK.includes(term) || term.includes(lowerK));
      });
      if (matchedKey) {
        finalKey = matchedKey;
      }
    }
  }

  return data.map(row => {
    const val = row[finalKey];
    if (val !== undefined && val !== null) {
      return { ...row, [finalKey]: normalizeToPrimaryName(String(val)) };
    }
    return row;
  });
};
