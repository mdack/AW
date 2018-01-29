"use strict";

/*
 * Manejador que se ejecuta cuando el DOM se haya cargado.
 */
$(() => {
    // Solicita al servidor la lista de tareas, y la muestra en la página
    loadTasks();

    // Cuando se pulse alguno de los botones 'Eliminar', se llamará a
    // la función onRemoveButtonClick
    $("div.tasks").on("click", "button.remove", onRemoveButtonClick);

    // Cuando se pulse el botón de 'Añadir', se llamará a la función
    // onAddButtonClick
    $("button.add").on("click", onAddButtonClick);
});

/*
 * Convierte una tarea en un elemento DOM.
 *  
 * @param {task} Tarea a convertir. Debe ser un objeto con dos atributos: id y text.
 * @return Selección jQuery con el elemento del DOM creado
 */
function taskToDOMElement(task) {
    let result = $("<li>").addClass("task");
    result.append($("<span>").text(task.text));
    result.append($("<button>").addClass("remove").text("Eliminar"));
    result.data("id", task.id);
    return result;
    
}

function loadTasks() {
    $.ajax({
        type: "GET",
        url: "/tasks",
        success: (data, textStatus, jqXHR) => {
            var len = data.length;
            for(var i=0;i<len;i++){
                var r = taskToDOMElement(data[i]);
                $("li.newTask").before(r);
        
            }
        },
        error: (jqXHR, textStatus, errorThrown) => {
            alert("Error al recuperar las tareas " + errorThrown);
        }
    });
}


function onRemoveButtonClick(event) {
    // Obtenemos el botón 'Eliminar' sobre el que se ha
    // hecho clic.
    let selected = $(event.target);

    // Obtenemos el elemento <li> que contiene el botón
    // pulsado.
    let liPadre = selected.parent();
    let id = liPadre.data("id");

    $.ajax({
        type : "DELETE",
        url: "/tasks/" + id,

        // En caso de éxito, colocamos el texto con el resultado
        // en el documento HTML
        success: function (data, textStatus, jqXHR) {
            liPadre.remove();
        },
            // En caso de error, mostramos el error producido
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Se ha producido un error: " + errorThrown);
        }
    });
}

function onAddButtonClick(event) {

        let valor = $("input[name=taskText]").val();
        if(valor != ""){
        $.ajax({
            type : "POST",
            url: "/tasks",
            contentType: "application/json",
            data: JSON.stringify({ text : valor }),
            // En caso de éxito, colocamos el texto con el resultado
            // en el documento HTML
            success: function (data, textStatus, jqXHR) {
                var r = taskToDOMElement(data);
                $("li.newTask").before(r);
            },
                // En caso de error, mostramos el error producido
            error: function (jqXHR, textStatus, errorThrown) {
 
                alert("Se ha producido un error: " + errorThrown);
            }
        });
        } else{
            console.log("CADENA VACÍA!");
        }
    
}

