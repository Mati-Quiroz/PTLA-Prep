let banco = [];
let preguntasMateria = [];
let indice = 0;
let aciertos = 0;
let fallos = 0;
let modoActual = "materia";

let timerInterval = null;
let segundosRestantes = 0;

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  configurarBotonesPrincipales();
  cargarBancoPreguntas();
}

function cargarBancoPreguntas() {
fetch("./banco_preguntas_ptla.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el banco de preguntas");
      }
      return response.json();
    })
.then(data => {

    banco = data;

    console.log("BANCO CARGADO:", banco.length);

    cargarMaterias();

    console.log("MATERIAS CARGADAS");

    activarBuscador();

})
.catch(error => {

    console.error("Error:", error);

    alert("No se pudo cargar el banco de preguntas.");

});
function configurarBotonesPrincipales() {

  asignarClick("btnEstudio", () => {
    mostrarPantalla("inicio");
  });

  asignarClick("btnTest", () => {
    if (banco.length === 0) {
      alert("El banco de preguntas aún se está cargando. Intenta nuevamente.");
      return;
    }

    iniciarModoTest();
  });

  asignarClick("volverMenuDesdeMaterias", () => {
    mostrarPantalla("menuPrincipal");
  });

  asignarClick("volverMenuFinal", () => {
    detenerTimer();
    mostrarPantalla("menuPrincipal");
  });

  asignarClick("volver", () => {
    detenerTimer();

    if (modoActual === "test") {
      mostrarPantalla("menuPrincipal");
    } else {
      mostrarPantalla("inicio");
    }
  });

  asignarClick("siguiente", () => {
    indice++;

    if (indice >= preguntasMateria.length) {
      finalizar();
      return;
    }

    mostrarPregunta();
  });
}
function asignarClick(id, accion) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.onclick = accion;
  }
}

function mostrarPantalla(pantalla) {
  const menuPrincipal = document.getElementById("menuPrincipal");
  const inicio = document.getElementById("inicio");
  const quiz = document.getElementById("quiz");
  const final = document.getElementById("final");

  if (menuPrincipal) menuPrincipal.style.display = "none";
  if (inicio) inicio.style.display = "none";
  if (quiz) quiz.style.display = "none";
  if (final) final.style.display = "none";

  const pantallaActiva = document.getElementById(pantalla);

  if (pantallaActiva) {
    if (pantalla === "menuPrincipal") {
      pantallaActiva.style.display = "flex";
    } else {
      pantallaActiva.style.display = "block";
    }
  }
}

function cargarMaterias() {
  const contenedor = document.getElementById("materias");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const materias = [...new Set(banco.map(p => p.materia))];

  materias.forEach(materia => {
    const boton = document.createElement("button");
    const porcentaje = obtenerPorcentajeMateria(materia);

    boton.innerHTML = `
      <span>${materia}</span>
      <small>${porcentaje}</small>
    `;

    boton.onclick = () => iniciarMateria(materia);

    contenedor.appendChild(boton);
  });
}

function iniciarMateria(materia) {
  modoActual = "materia";

  preguntasMateria = banco.filter(p => p.materia === materia);

  indice = 0;
  aciertos = 0;
  fallos = 0;

  detenerTimer();

  const timer = document.getElementById("timer");
  if (timer) timer.innerText = "";

  mostrarPantalla("quiz");
  mostrarPregunta();
}

function iniciarModoTest() {
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

function mostrarPregunta() {
  const preguntaActual = preguntasMateria[indice];

  if (!preguntaActual) {
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
    const boton = document.createElement("button");

    boton.className = "opcion";
    boton.innerText = `${letra}. ${texto}`;

    boton.onclick = () => responder(letra, preguntaActual);

    opcionesDiv.appendChild(boton);
  });
}

function responder(letra, pregunta) {
  const resultado = document.getElementById("resultado");

  if (letra === pregunta.correcta) {
    aciertos++;

    resultado.innerHTML = "✔ CORRECTO";
    resultado.className = "correcto";
  } else {
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

  document.querySelectorAll(".opcion").forEach(boton => {
    boton.disabled = true;
  });

  document.getElementById("aciertos").innerText = `Aciertos: ${aciertos}`;
  document.getElementById("fallos").innerText = `Fallos: ${fallos}`;

  actualizarPorcentaje();
}

function finalizar() {
  detenerTimer();

  mostrarPantalla("final");

  const total = aciertos + fallos;

  const porcentaje = total > 0
    ? Math.round((aciertos / total) * 100)
    : 0;

  let estado = "";

  if (modoActual === "test") {
    estado = porcentaje >= 75
      ? `<div class="aprobado">APROBADO</div>`
      : `<div class="reprobado">REPROBADO</div>`;

    document.getElementById("tituloFinal").innerText = "Resultado Modo Test";
  } else {
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

function actualizarPorcentaje() {
  const total = aciertos + fallos;

  const porcentaje = total > 0
    ? Math.round((aciertos / total) * 100)
    : 0;

  const porcentajeDiv = document.getElementById("porcentaje");

  if (porcentajeDiv) {
    porcentajeDiv.innerText = `${porcentaje}%`;
  }
}

function iniciarTimer(segundos) {
  detenerTimer();

  segundosRestantes = segundos;

  actualizarTimer();

  timerInterval = setInterval(() => {
    segundosRestantes--;

    actualizarTimer();

    if (segundosRestantes <= 0) {
      finalizar();
    }
  }, 1000);
}

function detenerTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function actualizarTimer() {
  const timer = document.getElementById("timer");

  if (!timer) return;

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;

  timer.innerText =
    `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function mezclarArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function guardarPreguntaFallada(pregunta) {
  let falladas = JSON.parse(localStorage.getItem("preguntasFalladas") || "[]");

  const existe = falladas.find(p => p.id === pregunta.id);

  if (!existe) {
    falladas.push(pregunta);
  }

  localStorage.setItem("preguntasFalladas", JSON.stringify(falladas));
}

function guardarEstadisticaPregunta(pregunta, correcta) {
  const clave = `estadistica_${pregunta.materia}`;

  let datos = JSON.parse(
    localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}'
  );

  if (correcta) {
    datos.correctas++;
  } else {
    datos.incorrectas++;
  }

  localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerPorcentajeMateria(materia) {
  const clave = `estadistica_${materia}`;

  let datos = JSON.parse(
    localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}'
  );

  const total = datos.correctas + datos.incorrectas;

  if (total === 0) {
    return "Sin registro";
  }

  const porcentaje = Math.round((datos.correctas / total) * 100);

  return `${porcentaje}% correctas`;
}

function activarBuscador() {
  const input = document.getElementById("buscador");
  const resultados = document.getElementById("resultadosBusqueda");

  if (!input || !resultados) return;

  input.oninput = () => {
    const termino = input.value.trim().toLowerCase();

    resultados.innerHTML = "";

    if (termino.length < 3) {
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

    if (encontrados.length === 0) {
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

      div.onclick = () => irAPregunta(p);

      resultados.appendChild(div);
    });
  };
}

function irAPregunta(preguntaObjetivo) {
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
