# Обзор проекта FunPay Customizer

Полный обзор структуры и содержимого проекта.

## 📊 Статистика проекта

### Количество файлов
- **JavaScript**: 5 файлов
- **CSS**: 3 файла
- **HTML**: 2 файла
- **JSON**: 4 файла
- **Markdown (документация)**: 12 файлов
- **PNG иконки**: 4 файла

### Размер проекта
- Основной код: ~35 KB
- Документация: ~90 KB
- Ресурсы (иконки): ~0.5 KB
- **Общий размер**: ~125 KB (без .git)

## 🗂️ Структура директорий

```
funpay-customizer/
│
├── 📄 Корневые файлы документации
│   ├── README.md           (7.8 KB)  - Основная документация
│   ├── QUICKSTART.md       (2.7 KB)  - Быстрый старт
│   ├── INSTALL.md          (9.0 KB)  - Инструкции по установке
│   ├── USAGE.md            (13 KB)   - Руководство пользователя
│   ├── CONTRIBUTING.md     (6.2 KB)  - Руководство для разработчиков
│   ├── FAQ.md              (14 KB)   - Часто задаваемые вопросы
│   ├── API.md              (11 KB)   - API документация
│   ├── CHANGELOG.md        (4.9 KB)  - История версий
│   ├── CREDITS.md          (5.5 KB)  - Благодарности
│   ├── LICENSE             (1.1 KB)  - MIT лицензия
│   ├── manifest.json       (1.3 KB)  - Манифест расширения
│   ├── package.json        (1.1 KB)  - NPM конфигурация
│   └── .gitignore          (0.5 KB)  - Git ignore правила
│
├── 📁 .github/              - GitHub шаблоны
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md            - Шаблон для багов
│   │   └── feature_request.md       - Шаблон для функций
│   └── pull_request_template.md     - Шаблон PR
│
├── 📁 popup/                - Popup интерфейс
│   ├── popup.html          (3.9 KB)  - HTML разметка
│   ├── popup.js            (4.4 KB)  - Логика popup
│   └── popup.css           (3.7 KB)  - Стили popup
│
├── 📁 options/              - Страница настроек
│   ├── options.html        (11 KB)   - HTML разметка
│   ├── options.js          (8.0 KB)  - Логика настроек
│   └── options.css         (8.6 KB)  - Стили настроек
│
├── 📁 content/              - Content scripts
│   ├── content.js          (11 KB)   - Основная логика
│   └── inject.css          (0.3 KB)  - Базовые стили
│
├── 📁 background/           - Service worker
│   └── background.js       (1.0 KB)  - Фоновые процессы
│
└── 📁 assets/               - Ресурсы
    ├── icons/               - Иконки
    │   ├── icon16.png       (88 B)
    │   ├── icon32.png       (116 B)
    │   ├── icon48.png       (130 B)
    │   ├── icon128.png      (165 B)
    │   ├── create_png.js    (1.7 KB) - Скрипт генерации
    │   └── generate_icons.sh (1.1 KB) - Bash скрипт
    │
    ├── themes/              - Темы
    │   └── preset-themes.json (2.3 KB) - Предустановленные темы
    │
    └── fonts/               - Шрифты
        └── available-fonts.json (1.8 KB) - Список шрифтов
```

## 🎯 Основные компоненты

### 1. Manifest (manifest.json)
- Версия Manifest: V3
- Разрешения: storage, activeTab
- Поддержка: Chrome, Firefox, Edge, Opera, Brave
- Content scripts: Автоматическое внедрение на funpay.com

### 2. Popup интерфейс (popup/)
**Функции:**
- Быстрый выбор темы
- Выбор шрифта и размера
- Загрузка обложки
- Кнопки применения/сброса

**Технологии:**
- Vanilla JavaScript
- CSS3 (градиенты, анимации)
- Chrome Storage API

### 3. Страница настроек (options/)
**Функции:**
- Визуальный выбор тем
- Детальная настройка шрифтов
- Управление обложками
- Создание кастомных тем
- Предпросмотр изменений

**Технологии:**
- Табы для навигации
- Color pickers
- File upload
- Real-time preview

### 4. Content Script (content/)
**Функции:**
- Внедрение CSS стилей
- Применение тем
- Загрузка шрифтов из Google Fonts
- Обработка обложек
- Прослушивание сообщений

**Технологии:**
- CSS Variables
- Dynamic style injection
- Google Fonts API
- Base64 image handling

### 5. Background Worker (background/)
**Функции:**
- Обработка установки
- Роутинг сообщений
- Применение к множественным табам

**Технологии:**
- Service Worker
- Message passing
- Tab management

## 📦 Предустановленный контент

### Темы (5 штук)
1. **Default** - Стандартная тема FunPay
2. **Dark** - Тёмная тема для ночной работы
3. **Light** - Светлая классическая тема
4. **Blue** - Синяя профессиональная тема
5. **Purple** - Фиолетовая креативная тема

### Шрифты (12 штук)
- Roboto
- Open Sans
- Lato
- Montserrat
- Raleway
- PT Sans
- PT Serif
- Ubuntu
- Poppins
- Nunito
- Merriweather
- Source Sans Pro

## 🔧 Настройки и конфигурация

### Chrome Storage
Хранит следующие данные:
```javascript
{
  theme: string,
  customTheme: object,
  font: string,
  fontSize: string,
  coverImage: string (base64),
  coverPosition: string,
  coverSize: string
}
```

### Лимиты
- Размер обложки: 5 MB
- Размер шрифта: 12-20 px
- Storage limit: Chrome sync storage (102,400 bytes)

## 📚 Документация

### Для пользователей
1. **QUICKSTART.md** - Начало за 3 минуты
2. **INSTALL.md** - Детальная установка
3. **USAGE.md** - Полное руководство
4. **FAQ.md** - Ответы на вопросы

### Для разработчиков
1. **CONTRIBUTING.md** - Как участвовать
2. **API.md** - API документация
3. **CHANGELOG.md** - История версий
4. **CREDITS.md** - Благодарности

### Административные
1. **README.md** - Главная страница
2. **LICENSE** - MIT лицензия
3. **PROJECT_SUMMARY.md** - Этот файл
4. **GitHub templates** - Issue/PR шаблоны

## 🎨 UI/UX Design

### Цветовая схема
- Основной градиент: #667eea → #764ba2
- Акцентные цвета: Фиолетовый/синий спектр
- Шрифты: System fonts (резервные)

### Анимации
- Fade in для табов
- Slide in для уведомлений
- Hover эффекты на кнопках
- Плавные переходы цветов

### Адаптивность
- Popup: фиксированная ширина 350px
- Options: адаптивная до 1200px
- Медиа запросы для мобильных устройств

## 🔐 Безопасность

### Разрешения
- `storage` - Только для настроек
- `activeTab` - Только активная вкладка
- `host_permissions` - Только funpay.com

### Приватность
- Нет внешних запросов (кроме Google Fonts)
- Нет аналитики
- Нет сбора данных
- Все локально

### Open Source
- Полный исходный код
- MIT лицензия
- Прозрачный код
- Community-driven

## 🚀 Производительность

### Оптимизации
- Lazy loading шрифтов
- CSS transitions (GPU accelerated)
- Минимальный JavaScript
- Нет внешних библиотек

### Размер бандла
- Минимальный размер
- Нет сборщиков
- Vanilla JavaScript
- Pure CSS

## 🔄 Версионирование

### Текущая версия: 1.0.0
- Semantic Versioning (SemVer)
- CHANGELOG.md для отслеживания
- Git tags для релизов

### Планы (roadmap)
См. CHANGELOG.md раздел [Unreleased]

## 📞 Контакты и поддержка

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: Через профиль GitHub
- **Contributing**: Pull Requests приветствуются

## 🎓 Лицензия

MIT License - Полная свобода использования

---

**Версия документа**: 1.0.0  
**Дата обновления**: 2024-11-03  
**Статус проекта**: ✅ Готов к использованию

---

_Этот документ автоматически генерируется на основе структуры проекта._
