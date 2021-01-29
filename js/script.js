//@ts-check



import {
    gameData
} from "./questions.js";

const NUM_PREGUNTAS = 5;


var preguntas = new Array();
const options = {
    title: 'Tiempos por partida',
    hAxis: {
        title: 'Intentos'
    },
    vAxis: {
        title: 'Tiempo'
    }
};
const divPaises = document.getElementById("paises");
const divCiudades = document.getElementById("ciudades");
var map = L.map('mapid').setView([28.456281964759878, -16.283268201861382], 14);
var newGame = document.getElementById("newGame");
newGame.addEventListener("click", nuevoJuego);
var tiempoLabel = document.getElementById("timeText");
var tiempoJuego = 0;
var dataTimes;
var dataPaises;
var chartPaises;
var chartTiempos;
var myTimer;
var intento = 0;
var ocurrencias = [
    ['Paises', 'cantidad']
];
cargarPaisesOcurrencias();

L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=3ebUoMnNihQItAakZCbl', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
}).addTo(map);

var marker = L.marker([28.456281964759878, -16.283268201861382]).addTo(map);
marker.bindPopup('Cesar Manrique');


/**
 * Funciona que cambia el tiempo de la partida
 *
 */
function tiempoTimer() {
    tiempoJuego++;
    tiempoLabel.innerHTML = "Tiempo: " + tiempoJuego + "s";
}


/**
 * Resetea todos los parámetros usados para iniciar un nuevo juego
 *
 */
function nuevoJuego() {
    tiempoJuego = 0;
    window.clearInterval(myTimer);
    newGame.disabled = true;
    borrarHijos(divCiudades);
    borrarHijos(divPaises);
    generarPaises();
    colocarPaisesYCiudades();
    myTimer = setInterval(tiempoTimer, 1000);
    tiempoLabel.innerHTML = "Tiempo: 0s";
    $(function () {
        $(".textoCiudades").draggable({
            revert: "invalid",
        });
    });
}


/**
 * Carga todos los países para ponerlos a ocurrencias 0 y poderlos usar más tarde
 *
 */
function cargarPaisesOcurrencias(){
    gameData.countries.forEach(element => {
        ocurrencias.push([element.name,0])
    });
}


/**
 *  Entra un pais y se busca  dentro del array de ocurrencias para poder aumentarle en 1 el número de ocurrencias.
 *
 * @param {String} pais
 */
function aumentarOcurrenciaPais(pais){
    let i =0;
    while(ocurrencias[i][0]!=pais){i++}

    let num= ocurrencias[i][1]; 
    num++;
    ocurrencias[i][1]=num;
}


/**
 * Coloca una serie de países y de ciudades según los países elegidos
 *
 */
function colocarPaisesYCiudades() {
    var ciudades = new Array();
    preguntas.forEach(element => {
        divPaises.appendChild(cloneTemplatePais(element));
        droppable(element);
        ciudades.push({
            name: element.cities[Math.floor(Math.random() * element.cities.length)].name,
            countryCode: element.code
        });
    });
    while (ciudades.length != 0) {
        let num = Math.floor(Math.random() * ciudades.length);
        let ciudad = ciudades[num];
        divCiudades.appendChild(cloneTemplateCiudad(ciudad));
        ciudades.splice(num, 1);
    }
}


/**
 * Es la función del elemento que recibe el draggable y calcula si si coincide el país en la ciudad, si esto es correcto se modifica el gráfico de países y si las preguntas se acaban, termina el juego
 *
 * @param {Pais} element
 */
function droppable(element) {
    $("." + element.code).droppable({
        accept: "." + element.code,
        drop: function (event, ui) {
            let pais = preguntas.filter(e => e.name === this.getAttribute("data-value"));
            let ciudad = ui.draggable.attr("data-value");
            if (pais[0].cities.filter(e => e.name === ciudad).length > 0) {
                map.removeLayer(marker);
                ciudad = pais[0].cities.filter(e => e.name === ciudad);
                marker = L.marker([ciudad[0].location[0], ciudad[0].location[1]]).addTo(map);
                marker.bindPopup(ciudad[0].name);
                map.flyTo([ciudad[0].location[0], ciudad[0].location[1]], 14);
                this.classList.add("correcto");
                ui.draggable.draggable("destroy");
                aumentarOcurrenciaPais(pais[0].name);
                dibujarGraficaPaises();
                eliminarPregunta(pais[0]);
                if (preguntas.length == 0) {
                    dibujarGraficaTiempos();
                    newGame.disabled = false;
                    window.clearInterval(myTimer);
                }
            }
        }
    });
}

/**
 *Elimina una pregunta del array de preguntas
 *
 * @param {Pais} pregunta
 */
function eliminarPregunta(pregunta) {
    preguntas.splice(preguntas.indexOf(pregunta), 1);
}


/**
 * Clona un nodo template con la informacion de un pais
 *
 * @param {Pais} pais
 * @return {element} 
 */
function cloneTemplatePais(pais) {
    let node = document.getElementById("paisTemplate").content.cloneNode(true).firstElementChild;
    node.lastElementChild.classList.add(pais.code);
    node.firstElementChild.innerHTML = pais.name;
    node.lastElementChild.dataset.value = pais.name;
    return node;
}
/**
 * Clona un nodo template con la informacion de una ciudad
 *
 * @param {Ciudad} ciudad
 * @return {element} 
 */
function cloneTemplateCiudad(ciudad) {
    let node = document.getElementById("ciudadTemplate").content.cloneNode(true).firstElementChild;
    node.classList.add(ciudad.countryCode);
    node.innerHTML = ciudad.name;
    node.dataset.value = ciudad.name;
    return node;
}

/**
 *Genera una serie de preguntas según los países dentro de gameData
 *
 */
function generarPaises() {
    preguntas = new Array();
    while (preguntas.length != NUM_PREGUNTAS) {
        let pais = gameData.countries[Math.floor(Math.random() * gameData.countries.length)];
        if (!preguntas.includes(pais)) {
            preguntas.push(pais);
        }
    }
}


/**
 * Borra los hijos de un nodo que entra como parámetro
 *
 * @param {element} node
 */
function borrarHijos(node) {
    while (node.lastElementChild) {
        borrarHijos(node.lastElementChild);
        node.removeChild(node.lastElementChild);
    }
}


/**
 * Escriba en la grafica de tiempos un nuevo tiempo con el intento correspondiente
 *
 */
function dibujarGraficaTiempos() {
    intento++;
    dataTimes.addRow([intento, tiempoJuego]);
    chartTiempos.draw(dataTimes, options);
}


/**
 * Dibuja en la gráfica de paises un nuevo país según el array de ocurencias.
 *
 */
function dibujarGraficaPaises() {
    dataPaises = google.visualization.arrayToDataTable(
        ocurrencias
    );


    var options = {
        title: 'Ocurrencia de paises'
    };

    
    chartPaises.draw(dataPaises, options);

}


google.charts.load('current', {
    'packages': ['corechart']
});
google.charts.setOnLoadCallback(drawChart);



function drawChart() {

    dataPaises = google.visualization.arrayToDataTable(
        ocurrencias
    );


    var options = {
        title: 'Ocurrencia de paises'
    };

    chartPaises = new google.visualization.PieChart(document.getElementById('graficoPaises'));

    chartPaises.draw(dataPaises, options);
}


google.charts.load('current', {
    packages: ['corechart', 'line']
});
google.charts.setOnLoadCallback(drawBasic);

function drawBasic() {

    dataTimes = new google.visualization.DataTable();
    dataTimes.addColumn('number', 'Tiempos por partida');
    dataTimes.addColumn('number', 'Tiempos');

    chartTiempos = new google.visualization.LineChart(document.getElementById('graficoTiempo'));
    chartTiempos.draw(dataTimes, options);
}