let banco = [];
let preguntasMateria = [];
let indice = 0;
let aciertos = 0;
let fallos = 0;
let modoActual = "materia";

let timerInterval = null;
let segundosRestantes = 0;

// Mapa figura -> página del PDF de imágenes
const FIGURA_A_PAGINA = {"1":2,"2":2,"3":3,"4":3,"5":4,"6":4,"7":5,"8":6,"9":7,"10":8,"11":9,"12":10,"13":11,"14":12,"15":13,"16":13,"17":14,"18":15,"19":16,"20":16,"21":17,"22":17,"23":18,"24":19,"25":20,"26":21,"27":22,"28":23,"29":24,"30":25,"31":26,"32":27,"33":28,"34":29,"35":30,"36":31,"37":32,"38":33,"39":34,"40":35,"41":36,"42":37,"43":38,"44":39,"45":39,"46":40,"47":41,"48":42,"49":43,"50":43,"51":44,"52":45,"53":45,"54":46,"55":47,"56":48,"57":48,"58":49,"59":50,"60":50,"61":51,"62":51,"63":52,"64":52,"65":52,"66":53,"67":53,"68":54,"69":54,"70":55,"71":55,"72":56,"73":57,"74":57,"75":58,"76":58,"77":59,"78":59,"79":60,"80":61,"81":62,"82":63,"83":64,"84":65,"85":65,"86":66,"87":66,"88":67,"89":68,"90":69,"91":70,"92":71,"93":72,"94":73,"95":74,"96":75,"97":76,"98":77,"99":78,"100":79,"101":80,"102":81,"103":82,"104":83,"105":84,"106":85,"107":86,"108":87,"109":88,"110":89,"111":90,"112":91,"113":92,"114":93,"115":94,"116":95,"117":96,"118":97,"119":98,"120":99,"121":99,"122":99,"123":100,"124":100,"125":100,"126":101,"127":101,"128":101,"129":102,"130":102,"131":103,"132":103,"133":103,"134":103,"135":103,"136":103,"137":103,"138":103,"139":104,"140":105,"141":106,"142":106,"143":107,"144":108,"145":108,"146":108,"147":108,"148":108,"149":108,"150":108,"151":108,"152":108,"153":108,"154":108,"155":108,"156":109,"157":109};

document.addEventListener("DOMContentLoaded", iniciarApp);

function iniciarApp() {
  configurarBotonesPrincipales();
  crearModal();
  cargarBancoPreguntas();
}

function crearModal() {
  const modal = document.createElement("div");
  modal.id = "modalFigura";
  modal.innerHTML = `
    <div id="modalContenido">
      <button id="cerrarModal">✕</button>
      <img id="modalImagen" src="" alt="Figura">
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("cerrarModal").onclick = cerrarModal;
  modal.onclick = function(e) {
    if (e.target === modal) cerrarModal();
  };
}

function abrirModal(numFigura) {
  const pagina = FIGURA_A_PAGINA[String(numFigura)];
  if (!pagina) return;
  const modal = document.getElementById("modalFigura");
  const img = document.getElementById("modalImagen");
  img.src = `./figuras/figura-${pagina}.jpg`;
  modal.setAttribute("style", "display:flex !important");
}

function cerrarModal() {
  document.getElementById("modalFigura").setAttribute("style", "display:none !important");
}

function cargarBancoPreguntas() {
  fetch("./banco_preguntas_ptla.json")
    .then(response => {
      if (!response.ok) throw new Error("No se pudo cargar el banco de preguntas");
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
}

function configurarBotonesPrincipales() {
  asignarClick("btnEstudio", () => mostrarPantalla("inicio"));
  asignarClick("btnTest", () => {
    if (banco.length === 0) { alert("El banco de preguntas aún se está cargando."); return; }
    iniciarModoTest();
  });
  asignarClick("volverMenuDesdeMaterias", () => mostrarPantalla("menuPrincipal"));
  asignarClick("volverMenuFinal", () => { detenerTimer(); mostrarPantalla("menuPrincipal"); });
  asignarClick("volver", () => {
    detenerTimer();
    mostrarPantalla(modoActual === "test" ? "menuPrincipal" : "inicio");
  });
  asignarClick("siguiente", () => {
    indice++;
    if (indice >= preguntasMateria.length) { finalizar(); return; }
    mostrarPregunta();
  });
}

function asignarClick(id, accion) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.onclick = accion;
}

function mostrarPantalla(pantalla) {
  ["menuPrincipal", "inicio", "quiz", "final"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("style", "display:none !important");
  });
  const pantallaActiva = document.getElementById(pantalla);
  if (pantallaActiva) {
    pantallaActiva.setAttribute("style", pantalla === "menuPrincipal"
      ? "display:flex !important"
      : "display:block !important"
    );
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
    boton.innerHTML = `<span>${materia}</span><small>${porcentaje}</small>`;
    boton.onclick = () => iniciarMateria(materia);
    contenedor.appendChild(boton);
  });
}

function iniciarMateria(materia) {
  modoActual = "materia";
  preguntasMateria = banco.filter(p => p.materia === materia);
  indice = 0; aciertos = 0; fallos = 0;
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
    const mezcladas = mezclarArray(banco.filter(p => p.materia === materia));
    preguntasMateria.push(...mezcladas.slice(0, 10));
  });
  preguntasMateria = mezclarArray(preguntasMateria);
  indice = 0; aciertos = 0; fallos = 0;
  iniciarTimer(90 * 60);
  mostrarPantalla("quiz");
  mostrarPregunta();
}

function mostrarPregunta() {
  const preguntaActual = preguntasMateria[indice];
  if (!preguntaActual) { finalizar(); return; }

  document.getElementById("contador").innerText = `Pregunta ${indice + 1}/${preguntasMateria.length}`;
  document.getElementById("aciertos").innerText = `Aciertos: ${aciertos}`;
  document.getElementById("fallos").innerText = `Fallos: ${fallos}`;
  actualizarPorcentaje();
  document.getElementById("pregunta").innerText = preguntaActual.pregunta;

  const resultado = document.getElementById("resultado");
  resultado.innerHTML = ""; resultado.className = "";

  const btnFigura = document.getElementById("btnVerFigura");
  if (preguntaActual.pagina_pdf && FIGURA_A_PAGINA[String(preguntaActual.pagina_pdf)]) {
    btnFigura.setAttribute("style", "display:block !important");
    btnFigura.onclick = () => abrirModal(preguntaActual.pagina_pdf);
  } else {
    btnFigura.setAttribute("style", "display:none !important");
  }

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
    resultado.innerHTML = `✘ INCORRECTO<br>Respuesta correcta: ${pregunta.correcta}<br><br>${pregunta.respuesta_texto || ""}`;
    resultado.className = "incorrecto";
  }
  guardarEstadisticaPregunta(pregunta, letra === pregunta.correcta);
  document.querySelectorAll(".opcion").forEach(b => b.disabled = true);
  document.getElementById("aciertos").innerText = `Aciertos: ${aciertos}`;
  document.getElementById("fallos").innerText = `Fallos: ${fallos}`;
  actualizarPorcentaje();
}

function finalizar() {
  detenerTimer();
  mostrarPantalla("final");
  const total = aciertos + fallos;
  const porcentaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  let estado = "";
  if (modoActual === "test") {
    estado = porcentaje >= 75
      ? `<div class="aprobado">APROBADO</div>`
      : `<div class="reprobado">REPROBADO</div>`;
    document.getElementById("tituloFinal").innerText = "Resultado Modo Test";
  } else {
    document.getElementById("tituloFinal").innerText = "Resultado de Materia";
  }
  document.getElementById("resumen").innerHTML = `${estado}Correctas: ${aciertos}<br>Incorrectas: ${fallos}<br>Total: ${total}<br>Resultado: ${porcentaje}%`;
  cargarMaterias();
}

function actualizarPorcentaje() {
  const total = aciertos + fallos;
  const porcentaje = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const el = document.getElementById("porcentaje");
  if (el) el.innerText = `${porcentaje}%`;
}

function iniciarTimer(segundos) {
  detenerTimer();
  segundosRestantes = segundos;
  actualizarTimer();
  timerInterval = setInterval(() => {
    segundosRestantes--;
    actualizarTimer();
    if (segundosRestantes <= 0) finalizar();
  }, 1000);
}

function detenerTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function actualizarTimer() {
  const timer = document.getElementById("timer");
  if (!timer) return;
  const m = Math.floor(segundosRestantes / 60);
  const s = segundosRestantes % 60;
  timer.innerText = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function mezclarArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function guardarPreguntaFallada(pregunta) {
  let falladas = JSON.parse(localStorage.getItem("preguntasFalladas") || "[]");
  if (!falladas.find(p => p.id === pregunta.id)) falladas.push(pregunta);
  localStorage.setItem("preguntasFalladas", JSON.stringify(falladas));
}

function guardarEstadisticaPregunta(pregunta, correcta) {
  const clave = `estadistica_${pregunta.materia}`;
  let datos = JSON.parse(localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}');
  if (correcta) datos.correctas++; else datos.incorrectas++;
  localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerPorcentajeMateria(materia) {
  const clave = `estadistica_${materia}`;
  let datos = JSON.parse(localStorage.getItem(clave) || '{"correctas":0,"incorrectas":0}');
  const total = datos.correctas + datos.incorrectas;
  if (total === 0) return "Sin registro";
  return `${Math.round((datos.correctas / total) * 100)}% correctas`;
}

function activarBuscador() {
  const input = document.getElementById("buscador");
  const resultados = document.getElementById("resultadosBusqueda");
  if (!input || !resultados) return;
  input.oninput = () => {
    const termino = input.value.trim().toLowerCase();
    resultados.innerHTML = "";
    if (termino.length < 3) return;
    const encontrados = banco.filter(p => {
      return `${p.materia} ${p.pregunta} ${Object.values(p.opciones||{}).join(" ")} ${p.respuesta_texto||""}`.toLowerCase().includes(termino);
    }).slice(0, 25);
    if (encontrados.length === 0) {
      resultados.innerHTML = `<div class="resultado-busqueda">No se encontraron resultados.</div>`;
      return;
    }
    encontrados.forEach(p => {
      const div = document.createElement("div");
      div.className = "resultado-busqueda";
      div.innerHTML = `<div class="resultado-materia">${p.materia} - Pregunta ${p.numero}</div><div class="resultado-pregunta">${p.pregunta.substring(0,120)}...</div>`;
      div.onclick = () => irAPregunta(p);
      resultados.appendChild(div);
    });
  };
}

function irAPregunta(preguntaObjetivo) {
  modoActual = "materia";
  preguntasMateria = banco.filter(p => p.materia === preguntaObjetivo.materia);
  indice = preguntasMateria.findIndex(p => p.id === preguntaObjetivo.id);
  aciertos = 0; fallos = 0;
  detenerTimer();
  mostrarPantalla("quiz");
  mostrarPregunta();
}
