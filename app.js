let banco = [];
let preguntasMateria = [];
let indice = 0;
let aciertos = 0;
let fallos = 0;

fetch("banco_preguntas_ptla.json")
  .then(response => response.json())
  .then(data => {
    banco = data;
    cargarMaterias();
  });

function cargarMaterias() {
  const materias = [...new Set(banco.map(p => p.materia))];

  const contenedor = document.getElementById("materias");

  materias.forEach(materia => {

    const btn = document.createElement("button");

    btn.textContent = materia;

    btn.onclick = () => iniciarMateria(materia);

    contenedor.appendChild(btn);

  });
}

function iniciarMateria(materia){

  preguntasMateria = banco.filter(
    p => p.materia === materia
  );

  indice = 0;
  aciertos = 0;
  fallos = 0;

  document.getElementById("inicio").style.display = "none";
  document.getElementById("quiz").style.display = "block";

  mostrarPregunta();
}

function mostrarPregunta(){

  const preguntaActual = preguntasMateria[indice];

  document.getElementById("contador").innerText =
    `Pregunta ${indice+1}/${preguntasMateria.length}`;

  document.getElementById("aciertos").innerText =
    `Aciertos: ${aciertos}`;

  document.getElementById("fallos").innerText =
    `Fallos: ${fallos}`;

  document.getElementById("pregunta").innerText =
    preguntaActual.pregunta;

  document.getElementById("resultado").innerHTML = "";

  const opcionesDiv =
    document.getElementById("opciones");

  opcionesDiv.innerHTML = "";

  Object.entries(preguntaActual.opciones)
    .forEach(([letra,texto]) => {

      const btn =
        document.createElement("button");

      btn.className = "opcion";

      btn.innerText =
        `${letra}. ${texto}`;

      btn.onclick = () =>
        responder(letra,preguntaActual);

      opcionesDiv.appendChild(btn);

    });

}

function responder(letra,pregunta){

  const resultado =
    document.getElementById("resultado");

  if(letra === pregunta.correcta){

      aciertos++;

      resultado.innerHTML =
        "✔ CORRECTO";

      resultado.className =
        "correcto";

  }else{

      fallos++;

      resultado.innerHTML =
        `✘ INCORRECTO<br>
        Respuesta correcta:
        ${pregunta.correcta}
        <br><br>
        ${pregunta.respuesta_texto}`;

      resultado.className =
        "incorrecto";
  }

  document.querySelectorAll(".opcion")
    .forEach(b => b.disabled = true);

}

document
.getElementById("siguiente")
.addEventListener("click",()=>{

  indice++;

  if(indice >= preguntasMateria.length){

      finalizar();

      return;
  }

  mostrarPregunta();

});

function finalizar(){

  document.getElementById("quiz")
    .style.display = "none";

  document.getElementById("final")
    .style.display = "block";

  const total =
    aciertos + fallos;

  const porcentaje =
    Math.round(
      (aciertos/total)*100
    );

  document.getElementById("resumen")
    .innerHTML = `
      Correctas: ${aciertos}<br>
      Incorrectas: ${fallos}<br>
      Total: ${total}<br>
      Resultado: ${porcentaje}%
    `;
}
document
.getElementById("volver")
.addEventListener("click",()=>{

  document.getElementById("quiz").style.display = "none";
  document.getElementById("final").style.display = "none";
  document.getElementById("inicio").style.display = "block";

  indice = 0;
  aciertos = 0;
  fallos = 0;

});