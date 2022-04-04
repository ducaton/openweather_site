var current_city = "Москва";
var weather_data;
var temperature_unit = 1;
var url = 'http://localhost:3000'
var header = ["Content-Type", "application/json;charset=UTF-8"];
var owtoken = '';

var myChart = new Chart(document.getElementById('weather_chart'), {
  type: 'line',
  options: {
    animation: false,
    responsive: false,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        radius: 0
      }
    },
    scales: {
      temperature: {
        ticks:{
            stepSize : 1,
        },
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: function(context) {
            if (context.index == 0)
              return '#000';
            if (context.tick.value == 0) 
              return '#777';
            return '#E2E2E2';
          },
        },
      },
      rain: {
        type: 'linear',
        display: false,
        position: 'right',
        beginAtZero: true,
        suggestedMax: 30,
        grid: {
          drawOnChartArea: false,
        },
      },
      wind_speed: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        suggestedMax: 50,
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: {
          autoSkip: false,
        },
        grid: {
          color: function(context) {
            if ((context.index == 0) || (context.index == 47))
              return '#000';
            let curr_time = new Date;
            let val = context.tick.value;
            curr_time = curr_time.getHours();
            if ((val == (24-curr_time)) || (val == (48-curr_time)))
              return '#777';
            return '#E2E2E2';
          }
        }
      },
    },
  },
});

function UpdGraph (owdata) {
  let labels = [];
  let temperature_data = [];
  let wind_data = [];
  let rain_data = [];
  for (let i=0; i<=owdata.hourly.length-1; i++) {
    if (i % 2 == 1)
      labels[i] = ''
    else
      labels[i] = new Date (owdata.hourly[i].dt*1000).getHours();
    if (temperature_unit == 1)
      temperature_data[i] = owdata.hourly[i].temp;
    if (temperature_unit == 2)
      temperature_data[i] = (owdata.hourly[i].temp * 1.8 + 32).toFixed(2)
    if (temperature_unit == 3)
      temperature_data[i] = (owdata.hourly[i].temp + 273.15).toFixed(2)
    wind_data[i] = owdata.hourly[i].wind_speed;
    if ("rain" in owdata.hourly[i]) {
      rain_data[i] = owdata.hourly[i].rain["1h"];
    } else {
      rain_data[i] = 0;
    }
  }
  myChart.data = {
    labels: labels,
    datasets: [{
      label: 'Температура',
      backgroundColor: '#800080',
      borderColor: '#800080',
      data: temperature_data,
      tension: 0.4,
      spanGaps: true,
      yAxisID: 'temperature'
    },
    {
      label: 'Ветер',
      backgroundColor: 'rgb(25, 200, 0)',
      borderColor: 'rgb(25, 200, 0)',
      data: wind_data,
      tension: 0.4,
      spanGaps: true,
      yAxisID: 'wind_speed'
    },
    {
      label: 'Осадки',
      backgroundColor: 'rgb(0, 25, 200)',
      borderColor: 'rgb(0, 25, 200)',
      data: rain_data,
      tension: 0.4,
      type: 'bar',
      yAxisID: 'rain'
    }]
  };
  myChart.update();
}

function ChangeWeatherData (weather) {
  document.querySelector(".current_city").innerHTML = current_city;
  document.querySelector(".current_city2").innerHTML = current_city;
  document.querySelector(".current_city_fav").querySelector(".current_city_fav > span").innerHTML = current_city;
  document.querySelector(".weather_condition").innerHTML = weather.current.weather[0].description;
  if (temperature_unit == 1)
    document.querySelector(".weather_text_big").innerHTML = "<span class=\"weather_temperature\">"+weather.current.temp+"</span>°С";
  if (temperature_unit == 2)
    document.querySelector(".weather_text_big").innerHTML = "<span class=\"weather_temperature\">"+(weather.current.temp * 1.8 + 32).toFixed(2)+"</span>°F";
  if (temperature_unit == 3)
    document.querySelector(".weather_text_big").innerHTML = "<span class=\"weather_temperature\">"+(weather.current.temp + 273.15).toFixed(2)+"</span>K";
  document.querySelector(".weather_wind").innerHTML = weather.current.wind_speed;
  let precip_HTML = document.querySelector(".weather_precipitation");
  if ("rain" in weather.current) {
    precip_HTML.innerHTML = weather.current.rain["1h"];
  } else {
    precip_HTML.innerHTML = 0;
  }
  let weather_icon_HTML = document.querySelector(".weather_icon");
  switch (weather.current.weather[0].main) {
    case 'Clear':
      weather_icon_HTML.innerHTML = '☀️';
      break;
    case 'Clouds':
      weather_icon_HTML.innerHTML = '☁️';
      break;
    case 'Rain' || 'Drizzle':
      weather_icon_HTML.innerHTML = '🌧️';
      break;
    case 'Snow':
      weather_icon_HTML.innerHTML = '🌨️';
      break;
    case 'Thunderstorm':
      weather_icon_HTML.innerHTML = '🌩️';
      break;
    default:
      weather_icon_HTML.innerHTML = '🌫️';
  }
  let cels_btn = document.querySelector(".celsium_btn");
  let fahr_btn = document.querySelector(".fahrenheit_btn");
  let kelv_btn = document.querySelector(".kelvin_btn");
  cels_btn.style.setProperty("background","none");
  fahr_btn.style.setProperty("background","none");
  kelv_btn.style.setProperty("background","none");
  if (temperature_unit == 1)
    cels_btn.style.setProperty("background","#80008050");
  else if (temperature_unit == 2)
    fahr_btn.style.setProperty("background","#80008050");
  else if (temperature_unit == 3)
    kelv_btn.style.setProperty("background","#80008050");
}

function makeRequest (method, url, loc_header, data) {
  return new Promise(function (resolve) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (Array.isArray(loc_header) && loc_header.length) {      
      xhr.setRequestHeader(loc_header[0], loc_header[1]);
    }
    xhr.onload = function () {
      try {
        resolve(JSON.parse(xhr.response));
      } catch {
        resolve(xhr.response);
      }
    };
    xhr.onerror = function () {
      try {
        resolve(JSON.parse(xhr.response));
      } catch {
        resolve(xhr.response);
      }
    };
    xhr.send(data);
  });
}

async function UpdWeatherData (city, putCurrentCity, callback) {
  if (document.querySelector(".current_city").innerHTML != city) {
    let owurl = 'https://api.openweathermap.org/data/2.5/weather?lang=ru&units=metric&appid=' + owtoken;
    //Указание города для прогноза
    owurl += '&q=' + city;
    let curr = await makeRequest("GET", owurl, 0, 0);
    if (curr.cod && curr.cod != 200) {
      alert('Не удалось получить данные:\n' + curr.message);
      current_city = "Москва";
      callback();
      return 0;
    }
    owurl = 'https://api.openweathermap.org/data/2.5/onecall?lang=ru&units=metric&exclude=minutely,daily,alerts&appid=' + owtoken
    owurl += '&lat=' + curr.coord.lat + "&lon=" + curr.coord.lon;
    let full = await makeRequest("GET", owurl, 0, 0);
    if (full.cod && full.cod != 200) {
      alert('Не удалось получить данные:\n' + full.message);
      callback();
      return 0;
    }
    current_city = curr.name;
    weather_data = full;
    if (putCurrentCity)
      PUTCurrentCity(curr.name);
  }
  ChangeWeatherData(weather_data);
  UpdGraph(weather_data);
  callback();
}

async function GETUserData() {
  let requrl = url + '/users';
  let userreq = await makeRequest("GET", requrl, header, null);
  requrl = url + '/fav_cities';
  let favcities = await makeRequest("GET", requrl, header, null);
  if (userreq.user == undefined) {
    return
  }
  document.querySelector(".login_dropdown").style.setProperty("display","none","important");
  document.querySelector(".user_dropdown").style.setProperty("display","none","");
  document.querySelector(".userid").innerHTML = userreq.user.id;
  document.querySelector(".username").innerHTML = userreq.user.username;
  if (userreq.user.current_city != null) {
    current_city = userreq.user.current_city;
    UpdWeatherData(current_city, 0, function() {});
  }
  if (userreq.user.id_units_temperature != null)
    temperature_unit = userreq.user.id_units_temperature
  else
    temperature_unit = 1;
  let fav_citiesHTML = document.querySelector(".fav_cities");
  let current_city_favHTML = document.querySelector(".current_city_fav");
  let fav_city_not_current = 1;
  fav_citiesHTML.innerHTML = "";
  favcities.forEach(element => {
    if (element.city.trim() == current_city.trim()) {
      current_city_favHTML.innerHTML = "\
        <span>"+element.city+"</span> <button class=\"del_fav_btn fav_btns\" id=\""+element.id+"\">❌</button>\
      ";
      fav_city_not_current = 0;
      return;
    }
    fav_citiesHTML.insertAdjacentHTML('beforeend', "\
      <div class=\"fav_city\">\
        <span class=\"city_change_from_fav\">"+element.city+"</span> <button class=\"del_fav_btn fav_btns\" id=\""+element.id+"\">❌</button>\
      </div>\
    ");
  });
  if (fav_city_not_current) {
    current_city_favHTML.innerHTML = "\
      <span>"+current_city+"</span> <button class=\"add_fav_btn fav_btns\">⭐</button>\
    "
    document.querySelector('.add_fav_btn').addEventListener('click', POSTFavCity);
  }
  node = document.querySelectorAll('.city_change_from_fav');
  node.forEach(element => element.addEventListener('click', (e) => {
    UpdWeatherData(element.innerHTML, 1, function() {
      GETUserData();
    });
  }));
  node = document.querySelectorAll('.del_fav_btn');
  node.forEach(element => element.addEventListener('click', async (e) => {
    requrl = url + '/fav_cities';
    let data = {
      id: element.id,
    }
    await makeRequest("DELETE", requrl, header, JSON.stringify(data));
    GETUserData();
  }));
}

async function login () {
  let requrl = url + '/login';
  let data = {
    uname: document.getElementsByName('uname')[0].value,
    pwd: document.getElementsByName('pwd')[0].value
  }
  let regreq = await makeRequest("POST", requrl, header, JSON.stringify(data));
  if (regreq.cod && regreq.cod != 200) {
    alert('Не удалось войти:\n' + regreq.message);
    return 0;
  }
  UpdWeatherData(current_city, 0, function() {
    GETUserData();
  });
}

async function logout () {
  let requrl = url + '/logout';
  let userreq = await makeRequest("GET", requrl, header, null);
  if (userreq.cod && userreq.cod == 200) {
    document.querySelector(".login_dropdown").style.setProperty("display","none","");
    document.querySelector(".user_dropdown").style.setProperty("display","none","important");
    document.querySelector(".userid").innerHTML = "und";
    document.querySelector(".username").innerHTML = "und";
    document.querySelector(".current_city_fav").innerHTML = "\
        <span>"+current_city+"</span> <button class=\"add_fav_btn fav_btns\">⭐</button>\
      "
    document.querySelector(".fav_cities").innerHTML = "";
  }
}

async function registration () {
  let requrl = url + '/register';
  let data = {
    uname: document.getElementsByName('uname')[0].value,
    pwd: document.getElementsByName('pwd')[0].value
  }
  let regreq = await makeRequest("POST", requrl, header, JSON.stringify(data));
  if (regreq.cod && regreq.cod != 200) {
    alert('Не удалось зарегистрироваться:\n' + regreq.message);
    return 0;
  }
}

async function POSTFavCity () {
  let requrl = url + '/fav_cities';
  let data = {
    city: document.querySelector(".current_city_fav").querySelector(".current_city_fav > span").innerHTML,
  };
  let regreq = await makeRequest("POST", requrl, header, JSON.stringify(data));
  if (regreq.cod && regreq.cod != 200) {
    alert('Не удалось добавить город:\n' + regreq.message);
    return 0;
  }
  GETUserData();
}

async function PUTTempUnit() {
  let requrl = url +'/temp_unit';
  let data = {unit: temperature_unit};
  await makeRequest("PUT", requrl, header, JSON.stringify(data));
}

async function PUTCurrentCity() {
  let requrl = '/current_city';
  let data = {
    city: current_city,
  }
  await makeRequest("PUT", requrl, header, JSON.stringify(data));
}

window.addEventListener('load', function(){
  //Кнопка поиска
  let node = document.querySelector('.search_button');
  node.addEventListener('click', (e)=>{
    e.stopPropagation();
    if (city = prompt("Какой город ищите?")) {
      UpdWeatherData(city, 1, function() {
        GETUserData();
      });
    }
  })
  //Температура - градус цельсия
  node = document.querySelector('.celsium_btn');
  node.addEventListener('click', ()=>{
    temperature_unit = 1;
    UpdWeatherData(current_city, 0, function(){});
    PUTTempUnit();
  }, false);
  //Температура - градус фаренгейта
  node = document.querySelector('.fahrenheit_btn');
  node.addEventListener('click', ()=>{
    temperature_unit = 2;
    UpdWeatherData(current_city, 0, function(){});
    PUTTempUnit();
  }, false);
  //Температура - кельвин
  node = document.querySelector('.kelvin_btn');
  node.addEventListener('click', ()=>{
    temperature_unit = 3;
    UpdWeatherData(current_city, 0, function(){});
    PUTTempUnit();
  }, false);
  //Кнопка входа
  node = document.querySelector('.login_btn');
  node.addEventListener('click', login, false);
  //Кнопка выхода
  node = document.querySelector('.logout_btn');
  node.addEventListener('click', logout, false);
  //Ссылка на регистрацию
  node = document.querySelector('.reg_link');
  node.addEventListener('click', (e)=>{
    e.stopPropagation()
    let reg_link_HTML = document.querySelector(".reg_link");
    if (reg_link_HTML.innerHTML == "X") {
      let reg_btn_HTML = document.querySelector(".reg_btn");
      reg_btn_HTML.innerHTML = "Войти";
      reg_btn_HTML.className = "auth login_btn";
      reg_link_HTML.innerHTML = "Регистрация";
      reg_btn_HTML.removeEventListener('click', registration);
      reg_btn_HTML.addEventListener('click', login, false);
    }
    else {
      let login_btn_HTML = document.querySelector(".login_btn");
      login_btn_HTML.innerHTML = "Зарегистрироваться";
      login_btn_HTML.className = "auth reg_btn";
      reg_link_HTML.innerHTML = "X";
      login_btn_HTML.removeEventListener('click', login);
      login_btn_HTML.addEventListener('click', registration, false);
    }
  })
  //Добавление любимого города
  node = document.querySelector('.add_fav_btn');
  node.addEventListener('click', POSTFavCity);
})

window.addEventListener("resize", () => {
  chart_container = document.querySelector(".main_meteogram")
  myChart.resize(chart_container.offsetWidth, chart_container.offsetHeight);
});

UpdWeatherData(current_city, 0, function() {
  GETUserData();
});
myChart.resize();