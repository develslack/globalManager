/**
 * Global Manager - i18n Engine
 */
const GMi18n = (function() {
    let currentLang = localStorage.getItem('gm_lang') || 'es';
    let dictionary = typeof langpack_es !== 'undefined' ? langpack_es : {};

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('gm_lang', lang);
        if (lang === 'en' && typeof langpack_en !== 'undefined') {
            dictionary = langpack_en;
        } else {
            dictionary = langpack_es;
        }
        translateDOM();
    }

    function t(key, defaultText = '') {
        return dictionary[key] || defaultText || key;
    }

    function translateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary[key]) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = dictionary[key];
                } else {
                    el.textContent = dictionary[key];
                }
            }
        });
    }

    return {
        setLanguage: setLanguage,
        t: t,
        translateDOM: translateDOM,
        getLang: () => currentLang
    };
})();
