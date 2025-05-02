// SRC/language.js
'use strict';

/**
 * Adds all necessary language strings to Lampa.Lang.
 */
export function setupLanguages() {
    if (window.Lampa && Lampa.Lang) {
        Lampa.Lang.add({
            // Strings from the original settings section
            mdblist_api_key_desc: {
                ru: "Введите ваш API ключ с сайта MDBList.com",
                en: "Enter your API key from MDBList.com",
                uk: "Введіть ваш API ключ з сайту MDBList.com"
            },
            additional_ratings_title: {
                 ru: "Дополнительные Рейтинги",
                 en: "Additional Ratings",
                 uk: "Додаткові Рейтинги"
            },
            select_ratings_button_name: {
                 en: "Select Rating Providers",
                 ru: "Выбрать Источники Рейтингов",
                 uk: "Обрати Джерела Рейтингів"
            },
            select_ratings_button_desc: {
                 en: "Choose which ratings to display",
                 ru: "Выберите, какие рейтинги отображать",
                 uk: "Оберіть, які рейтинги відображати"
            },
            select_ratings_dialog_title: {
                 en: "Select Ratings",
                 ru: "Выбор Рейтингов",
                 uk: "Вибір Рейтингів"
            },
            // String from the original startPlugin section
            full_notext: {
                 en: 'No description',
                 ru: 'Нет описания'
                 // Consider adding 'uk' translation if appropriate
            }
        });
        // Optional: console.log("PsahxRatingsPlugin: Language strings registered.");
    } else {
        console.error("PsahxRatingsPlugin [language.js]: Lampa.Lang not available.");
    }
}
