alert("APP.JS CARGADO");

let banco = [];
let preguntasMateria = [];
let indice = 0;
let aciertos = 0;
let fallos = 0;
let modoActual = "materia";

let timerInterval = null;
let segundosRestantes = 0;

document.addEventListener("DOMContentLoaded", () => {
  configurarBotonesPrincipales();
  cargarBancoPreguntas();
});

function cargarBancoPreguntas(){
  fetch("banco_preguntas_ptla.json")
    .then(response => response.json())
    .then(data => {
      banco = data;
      cargarMaterias();
      activarBuscador();
    })
    .catch(error => {
      console.error("Error cargando banco de preguntas:", error);
      alert("No se pudo cargar el banco de preguntas. Revisa el archivo JSON.");
    });
}

function configurarBotonesPrincipales(){

  const btnEstudio = document.getElementById("btnEstudio");
  const btnTest = document.getElementById("btnTest");
  const volverMenuDesdeMaterias = document.getElementById("volverMenuDesdeMaterias");
  const volverMenuFinal = document.getElementById("volverMenuFinal");
  const volver = document.getElementById("volver");
  const siguiente = document.getElementById("siguiente");

  if(btnEstudio){
    btnEstudio.addEventListener("click", () => {
      mostrarPantalla("inicio");
    });
  }

  if(btnTest){
    btnTest.addEventListener("click", () => {
      if(banco.length === 0){
        alert("Aún se está cargando el banco de preguntas. Intenta nuevamente en unos segundos.");
        return;
      }
      iniciarModoTest();
    });
  }

  if(volverMenuDesdeMaterias){
    volverMenuDesdeMaterias.addEventListener("click", () => {
      mostrarPantalla("menuPrincipal");
    });
  }

  if(volverMenuFinal){
    volverMenuFinal.addEventListener("click", () => {
      detenerTimer();
      mostrarPantalla("menuPrincipal");
    });
  }

  if(volver){
    volver.addEventListener("click", () => {
      detenerTimer();

      if(modoActual === "test"){
        mostrarPantalla("menuPrincipal");
      }else{
        mostrarPantalla("inicio");
      }
    });
  }

  if(siguiente){
    siguiente.addEventListener("click", () => {
      indice++;

      if(indice >= preguntasMateria.length){
        finalizar();
        return;
      }

      mostrarPregunta();
    });
  }
}

function mostrarPantalla(pantalla){

  const pantallas = ["menuPrincipal", "inicio", "quiz", "final"];

  pantallas.forEach(id => {
    const elemento = document.getElementById(id);
    if(elemento){
      elemento.style.display = "none";
    }
  });

  const pantallaActiva = document.getElementById(pantalla);

  if(pantallaActiva){
    pantallaActiva.style.display = "block";
  }
}

function cargarMaterias(){

  const contenedor = document.getElementById("materias");

  if(!contenedor) return;

  contenedor.innerHTML = "";

  const materias = [...new Set(banco.map(p => p.materia))];

  materias.forEach(materia => {

    const btn = document.createElement("button");

    const porcentaje = obtenerPorcentajeMateria(materia);

    btn.innerHTML = `
      <span>${materia}</span>
      <small>${porcentaje}</small>
    `;

    btn.addEventListener("click", () => iniciarMateria(materia));

    contenedor.appendChild(btn);
  });
}

function iniciarMateria(materia){

  modoActual = "materia";

  preguntasMateria = banco.filter(p => p.materia === materia);

  indice = 0;
  aciertos = 0;
  fallos = 0;

  detenerTimer();

  const timer = document.getElementById("timer");
  if(timer) timer.innerText = "";

  mostrarPantalla("quiz");
  mostrarPregunta();
}

function iniciarModoTest(){

  modoActual = "test";

  const materias = [...new Set(banco.map(p => p.materia))];

  preguntasMateria = [];

  materias.forEach(materia => {

    const preguntasDeMateria = banco.filter(p => p.materia === materia);

    const mezcladas = mezclarArray(preguntasDeMateria);

    preguntasMateria.push(...mezcladas.slice(0, 10));
  });

  preguntasMateria = mezclarArray(preguntasMateria);

  indice = 0;
  aciertos = 0;
  fallos = 0;

  iniciarTimer(90 * 60);

  mostrarPantalla("quiz");
  mostrarPregunta();
}

function mostrarPregunta(){

  const preguntaActual = preguntasMateria[indice];

  if(!preguntaActual){
    finalizar();
    return;
  }

  document.getElementById("contador").innerText =
    `Pregunta ${indice + 1}/${preguntasMateria.length}`;

  document.getElementById("aciertos").innerText =
    `Aciertos: ${aciertos}`;

  document.getElementById("fallos").innerText =
    `Fallos: ${fallos}`;

  actualizarPorcentaje();

  document.getElementById("pregunta").innerText = preguntaActual.pregunta;

  const resultado = document.getElementById("resultado");
  resultado.innerHTML = "";
  resultado.className = "";

  const opcionesDiv = document.getElementById("opciones");
  opcionesDiv.innerHTML = "";

  Object.entries(preguntaActual.opciones).forEach(([letra, texto]) => {

    const btn = document.createElement("button");

    btn.className = "opcion";
    btn.innerText = `${letra}. ${texto}`;

    btn.addEventListener("click", () => responder(letra, preguntaActual));

    opcionesDiv.appendChild(btn);
  });
}

function responder(letra, pregunta){

  const resultado = document.getElementById("resultado");

  if(letra === pregunta.correcta){

    aciertos++;

    resultado.innerHTML = "✔ CORRECTO";
    resultado.className = "correcto";

  }else{

    fallos++;

    guardarPreguntaFallada(pregunta);

    resultado.innerHTML = `
      ✘ INCORRECTO<br>
      Respuesta correcta: ${pregunta.correcta}<br><br>
      ${pregunta.respuesta_texto || ""}
    `;

    resultado.className = "incorrecto";
  }

  guardarEstadisticaPregunta(pregunta, letra === pregunta.correcta);

  document.querySelectorAll(".opcion").forEach(b => b.disabled = true);

  document.getElementById("aciertos").innerText = `Aciertos: ${aciertos}`;
  document.getElementById("fallos").innerText = `Fallos: ${fallos}`;

  actualizarPorcentaje();
}

function finalizar(){

  detenerTimer();

  mostrarPantalla("final");

  const total = aciertos + fallos;

  const porcentaje = total > 0
    ? Math.round((aciertos / total) * 100)
    : 0;

  let estado = "";

  if(modoActual === "test"){

    estado = porcentaje >= 75
      ? `<div class="aprobado">APROBADO</div>`
      : `<div class="reprobado">REPROBADO</div>`;

    document.getElementById("tituloFinal").innerText = "Resultado Modo Test";

  }else{

    document.getElementById("tituloFinal").innerText = "Resultado de Materia";
  }

  document.getElementById("resumen").innerHTML = `
    ${estado}
    Correctas: ${aciertos}<br>
    Incorrectas: ${fallos}<br>
    Total: ${total}<br>
    Resultado: ${porcentaje}%
  `;

  cargarMaterias();
}

function actualizarPorcentaje(){

  const total = aciertos + fallos;

  const porcentaje = total > 0
    ? Math.round((aciertos / total) * 100)
    : 0;

  const porcentajeDiv = document.getElementById("porcentaje");

  if(porcentajeDiv){
    porcentajeDiv.innerText = `${porcentaje}%`;
  }
}

function iniciarTimer(segundos){

  detenerTimer();

  segundosRestantes = segundos;

  actualizarTimer();

  timerInterval = setInterval(() => {

    segundosRestantes--;

    actualizarTimer();

    if(segundosRestantes <= 0){
      finalizar();
    }

  }, 1000);
}

function detenerTimer(){

  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function actualizarTimer(){

  const timer = document.getElementById("timer");

  if(!timer) return;

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  timer.innerText =
    `${String(minutos).padStart(2,"0")}:${String(segundos).padStart(2,"0")}`;
}

function mezclarArray(array){

  return [...array].sort(() => Math.random() - 0.5);
}

function guardarPreguntaFallada(pregunta){

  let falladas = JSON.parse(localStorage.getItem("preguntasFalladas") || "[]");

  const existe = falladas.find(p => p.id === pregunta.id);

  if(!existe){
    falladas.push(pregunta);
  }

  localStorage.setItem("preguntasFalladas", JSON.stringify(falladas));
}

function guardarEstadisticaPregunta(pregunta, correcta){

  const clave = `estadistica_${pregunta.materia}`;

  let datos = JSON.parse(
    localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}'
  );

  if(correcta){
    datos.correctas++;
  }else{
    datos.incorrectas++;
  }

  localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerPorcentajeMateria(materia){

  const clave = `estadistica_${materia}`;

  let datos = JSON.parse(
    localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}'
  );

  const total = datos.correctas + datos.incorrectas;

  if(total === 0){
    return "Sin registro";
  }

  const porcentaje = Math.round((datos.correctas / total) * 100);

  return `${porcentaje}% correctas`;
}

function activarBuscador(){

  const input = document.getElementById("buscador");
  const resultados = document.getElementById("resultadosBusqueda");

  if(!input || !resultados) return;

  input.addEventListener("input", () => {

    const termino = input.value.trim().toLowerCase();

    resultados.innerHTML = "";

    if(termino.length < 3){
      return;
    }

    const encontrados = banco.filter(p => {

      const textoCompleto = `
        ${p.materia}
        ${p.pregunta}
        ${Object.values(p.opciones || {}).join(" ")}
        ${p.respuesta_texto || ""}
      `.toLowerCase();

      return textoCompleto.includes(termino);

    }).slice(0, 25);

    if(encontrados.length === 0){

      resultados.innerHTML = `
        <div class="resultado-busqueda">
          No se encontraron resultados.
        </div>
      `;

      return;
    }

    encontrados.forEach(p => {

      const div = document.createElement("div");

      div.className = "resultado-busqueda";

      div.innerHTML = `
        <div class="resultado-materia">
          ${p.materia} - Pregunta ${p.numero}
        </div>
        <div class="resultado-pregunta">
          ${p.pregunta.substring(0, 120)}...
        </div>
      `;

      div.addEventListener("click", () => irAPregunta(p));

      resultados.appendChild(div);
    });
  });
}

function irAPregunta(preguntaObjetivo){

  modoActual = "materia";

  preguntasMateria = banco.filter(
    p => p.materia === preguntaObjetivo.materia
  );

  indice = preguntasMateria.findIndex(
    p => p.id === preguntaObjetivo.id
  );

  aciertos = 0;
  fallos = 0;

  detenerTimer();

  mostrarPantalla("quiz");
  mostrarPregunta();
}
