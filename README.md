# Сайт прогноза погоды OpenWeather

**express + passport.js + sqlite + chart.js**

### Описание

Сайт запрашивает данные о погоде через OpenWeather API и отображает их. 

Цели: создание учётных записей, использование удалённого сервера и использование БД. В учётной записи хранится имя пользователя, хешированный пароль, последний открытый город, избранные города и предпочитаемые единицы измерения показателей погоды. Эти функции доступны только после создания учётной записи.

**Возможно passport.js плохо интегрирован**

### Установка и запуск

1. Создайте учётную запись OpenWeather и запросите токен (https://openweathermap.org/price),
2. Поместите токен в ./public/index.js,
3. Запустите express-сервер командой: `./node_modules/nodemon/bin/nodemon.js s.js`,
4. Откройте в браузере `localhost:3000/`.

### Демонстрация:

БД:

![Изображение БД](/README-assets/sqlite.png)

Сайт:

![Изображение сайта](/README-assets/site.png)