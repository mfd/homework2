import "babel-polyfill";
import Chart from "chart.js";
import swal from 'sweetalert';

/* fonts */
import WebFont from 'webfontloader';

WebFont.load({
  google: {
    families: ['Roboto:300:cyrillic']
  }
});

// const currencyURL = "www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const meteoURL = "/xml.meteoservice.ru/export/gismeteo/point/140.xml";

async function loadWeather(url) {
  const response = await fetch(url);
  const xmlTest = await response.text();
  const parser = new DOMParser();
  const currencyData = parser.parseFromString(xmlTest, "text/xml");

  const forecast = currencyData.querySelectorAll("FORECAST[hour]");

  return forecast;
}

const buttonBuild = document.getElementById("btn");

const canvasCtx = document.getElementById("out").getContext("2d");

buttonBuild.addEventListener("click", async function() {
  //Получаем данные
  const forecast = await loadWeather(meteoURL);

  //Сюда будем пулять нужные данные для графика
  const data = [];

  // парсим XML объект по нужным атрибутам
  // Описание API
  // https://www.meteoservice.ru/content/export.html
  // TEMPERATURE - температура воздуха, в градусах Цельсия
  // HEAT - комфорт - температура воздуха по ощущению одетого по сезону человека, выходящего на улицу

  if (forecast.length > 0) {
    forecast.forEach(el => {
      let tTag = el.querySelector('TEMPERATURE');
      let hTag = el.querySelector('HEAT');
      // Cчитаем среднее от мин/макс
      let temper = (parseInt(tTag.getAttribute("min")) + parseInt(tTag.getAttribute("max"))) / 2;
      let heat = (parseInt(hTag.getAttribute("min")) + parseInt(hTag.getAttribute("max"))) / 2;
      // Время - часы
      let time = parseInt(el.getAttribute("hour"));
      // Дата дд/мм/гггг
      let date = `${el.getAttribute("day")}/${el.getAttribute("month")}/${el.getAttribute("year")}`

      data.push({
        'time': time,
        'date': date,
        'temp': temper,
        'heat': heat
      });
    });

    // сортируем по времени
    //data.sort((a, b) => a.time - b.time);
    console.table(data);
    //debugger;
    const chartConfig = {
      type: "line",

      data: {
        labels: data.map(key => `${key.time}:00 ${key.date}`),
        datasets: [
          {
            label: "Температура по ощущениям",
            backgroundColor: "rgb(139, 195, 74)",
            borderColor: "rgb(139, 195, 74)",
            data: data.map(key => key.heat)
          },
          {
            label: "Температура",
            backgroundColor: "rgb(244, 67, 54)",
            borderColor: "rgb(180, 0, 0)",
            data: data.map(key => key.temp)
          }

        ]
      }
    };

    if (window.chart) {
      chart.data.labels = chartConfig.data.labels;
      chart.data.datasets[0].data = chartConfig.data.datasets[0].data;
      chart.update({
        duration: 800,
        easing: "easeOutBounce"
      });
    } else {
      window.chart = new Chart(canvasCtx, chartConfig);
    }
  } else {
    swal("Упс!", "Что-то пошло не так! Проверьте консоль", "error");
  }
});


