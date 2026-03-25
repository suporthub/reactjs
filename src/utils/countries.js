import countriesLib from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import hiLocale from 'i18n-iso-countries/langs/hi.json';
import viLocale from 'i18n-iso-countries/langs/vi.json';
import idLocale from 'i18n-iso-countries/langs/id.json';
import arLocale from 'i18n-iso-countries/langs/ar.json';
import urLocale from 'i18n-iso-countries/langs/ur.json';

// Register locales
countriesLib.registerLocale(enLocale);
countriesLib.registerLocale(hiLocale);
countriesLib.registerLocale(viLocale);
countriesLib.registerLocale(idLocale);
countriesLib.registerLocale(arLocale);
countriesLib.registerLocale(urLocale);

export const langMapping = {
    en: 'en',
    hi: 'hi',
    vi: 'vi',
    id: 'id',
    ar: 'ar',
    ur: 'ur',
    english: 'en',
    hindi: 'hi',
    vietnam: 'vi',
    indonesian: 'id',
    arabic: 'ar',
    urdu: 'ur'
};

export const getCountriesForLanguage = (lang) => {
    const isoLang = langMapping[lang] || 'en';
    const countriesObj = countriesLib.getNames(isoLang, { select: "official" });
    return Object.keys(countriesObj).map(code => ({
        code,
        name: countriesObj[code]
    })).sort((a, b) => a.name.localeCompare(b.name, isoLang));
};

export default countriesLib;
