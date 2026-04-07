const COUNTRY_NAMES = {
  AF: 'אפגניסטן', AL: 'אלבניה', DZ: 'אלג׳יריה', AR: 'ארגנטינה', AU: 'אוסטרליה',
  AT: 'אוסטריה', AZ: 'אזרבייג׳ן', BE: 'בלגיה', BR: 'ברזיל', BG: 'בולגריה',
  CA: 'קנדה', CL: 'צ׳ילה', CN: 'סין', CO: 'קולומביה', HR: 'קרואטיה',
  CZ: 'צ׳כיה', DK: 'דנמרק', EG: 'מצרים', FI: 'פינלנד', FR: 'צרפת',
  DE: 'גרמניה', GR: 'יוון', HU: 'הונגריה', IN: 'הודו', ID: 'אינדונזיה',
  IR: 'איראן', IQ: 'עיראק', IE: 'אירלנד', IL: 'ישראל', IT: 'איטליה',
  JP: 'יפן', JO: 'ירדן', KZ: 'קזחסטן', KE: 'קניה', KW: 'כווית',
  LB: 'לבנון', LY: 'לוב', MY: 'מלזיה', MX: 'מקסיקו', MA: 'מרוקו',
  NL: 'הולנד', NZ: 'ניו זילנד', NG: 'ניגריה', NO: 'נורווגיה', PK: 'פקיסטן',
  PE: 'פרו', PH: 'פיליפינים', PL: 'פולין', PT: 'פורטוגל', QA: 'קטר',
  RO: 'רומניה', RU: 'רוסיה', SA: 'ערב הסעודית', RS: 'סרביה', ZA: 'דרום אפריקה',
  ES: 'ספרד', SE: 'שוודיה', CH: 'שוויץ', SY: 'סוריה', TW: 'טייוואן',
  TH: 'תאילנד', TN: 'תוניסיה', TR: 'טורקיה', UA: 'אוקראינה', AE: 'איחוד האמירויות',
  GB: 'בריטניה', US: 'ארצות הברית', UZ: 'אוזבקיסטן', VE: 'ונצואלה', VN: 'וייטנאם',
  YE: 'תימן',
};

export default function CountryFilter({ countries, value, onChange }) {
  return (
    <div className="country-filter">
      <select
        className="country-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="סינון לפי מדינה"
        dir="rtl"
      >
        <option value="">🌍 כל המדינות</option>
        {countries.map((code) => (
          <option key={code} value={code}>
            {COUNTRY_NAMES[code] || code}
          </option>
        ))}
      </select>
    </div>
  );
}
