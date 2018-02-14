"use strict";

let cadenaBase64 = "";
let user = {login: "", id: null};
let idP = null;
let nameP = "";
let tab = null;

$(document).ready(function() {
    $("#welcome").show();
    $(".error").hide();
    $("#game").hide();
    $("#logout").hide();
    $("#loginUser").on("click", loginUser);
    $("#newUser").on("click", newUser);
    $("#newGame").on("click", newGame);
    $("#logout").on("click", logout);
    $("#findGame").on("click", findGame);
    $("#tabs").on("click", "a.partida", getStatus);
    $("#update_game").on("click", updateGame);
    $("#play_cards").on("click", play);
    $("#lier").on("click", play);
});

function play(event){
    let valueCard = Number($("input[name=value_card]").val());
    $("input[name=value_card]").val("");
    let cards = [];
    if(isNaN(valueCard)){

        alert("Indica un valor para las cartas!");
    }else{

        let b = true;
        if($(event.target).prop("value") === "Mentiroso"){
            b = false;
        }
        if(b){
            $('#your_cards input[type=checkbox]').each(function(){

                if (this.checked) {
                    let c = $(this).data("cara");
                    let p = $(this).data("palo");  

                    cards.push({cara: c, palo: p});
                }
            }); 

            if(cards.length === 0){
                alert("Selecciona alguna carta!");
            }
            else if(cards.length > 3){
                alert("Solo puedes seleccionar hasta 3 cartas");
            }    
        }    

        if(!b || b && cards.length < 4 && cards.length > 0){
            $.ajax({
                type: "POST",
                url: "/games/action",
                contentType: "application/json",
                data: JSON.stringify({playCards: cards,
                                      user: user.login,
                                      id: idP,
                                      value: valueCard,
                                      button: b
                            }),
                success: function(data, statusText, jqXHR){
                    alert(data);  
                    showStatusGames();
                },
                error: function(jqXHR, statusText, errorThrown) {
                    alert("Error actualizando la partida");
                }          
            });
        }
    }
    event.preventDefault();
}

/**
 * En un principio segun la primera parte mostramos solo los jugadores
 * pero eso ya lo hace el botón de update, por lo que hacemos una peticion
 * en showGameStatus, para que si la lista de jugadores está completa ya muestre 
 * la información del juego.
 * @param {*} event 
 */
function getStatus(event){
    let partida = $(event.target);
    idP = partida.data("id");

    event.preventDefault();
    partida.addClass("active");
    tab.removeClass("active");
    tab = partida;

    if(idP === 0){
        $("#my_games").show();
        $("input[name=game_name]").val("");
        $("input[name=game_id]").val("");
        $("#view_game").hide();
    }else{
        let name = partida.data("name");
        nameP = name;
        $.ajax({
            type: "GET",
            url: "/games/update",
            contentType: "application/json",
            data: {id: idP},
            beforeSend: function (req) {
                req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
            },
            success: function(data, statusText, jqXHR){
                //Actualizar el div de view_game con la info 
                $("#players tbody tr").remove(); 
                if(data.players.length < 4){
                    playersToDOM(data.players);
                    $("#game_title").text(name);
                    $("#info_game").append($("<p>").text("La partida aún no tiene cuatro jugadores"));
                    $("#info_game").html("<p>El identificador de la partida es: <strong>" + idP + "</strong></p>");
                    $("#my_games").hide();
                    $("#view_game").show();
                    $("#game_cards").hide();
                    $("#user_cards").hide();
                    $("#table_history").hide();
                } else{
                    showStatusGames();
                }       
            },
            error: function(jqXHR, statusText, errorThrown) {
                alert("Error actualizando la partida");
            }
        });
    }

}

function showStatusGames(){
    $.ajax({
        type: "GET",
        url: "/games/status",
        data: {id: idP},
        beforeSend: function (req) {
            req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
        },
        success: function(data, statusText, jqXHR){
            $("#players tbody tr").remove();
            otherToDOM(data.playerCards, data.actTurn);
            $("#game_title").text(nameP);
            $("#info_game").empty();
            $("#my_games").hide();
            $("#view_game").show();
            $("#game_cards").show();

            //Cartas en la mesa
            $("#board_cards div").remove();
            for(let i = 0; i < data.playedCards.length; i++){
                let elem = $("<div>").addClass("cards").text(data.valueCards);
                $("#board_cards").append(elem);
            }
            let l = data.lastMove;
            $("#last_move").empty();
            $("#last_move").text("No hay cartas en la mesa");
            if(l.player !== ""){

                if(l.move.length > 0)
                    $("#last_move").text(l.player + " ha colocado " + l.move.length + " cartas con valor " + data.valueCards);                    
            }

            //Cartas del usuario
            $("#user_cards").show();
            let p = data.playerCards;
            let cards = [];
            p.forEach(j => {
                if(j.player === user.login){
                    cards = j.cards;
                }
            });        
            $("#cards_container").show();
            $("#your_cards div").remove();
            cards.forEach(c => {
                $("#your_cards").append('<div class="col-md-3"><label class="btn"><img src="imagenes/' + c.cara + '_' + c.palo + '.png"><input type="checkbox" data-cara=' + c.cara + ' data-palo=' + c.palo + '></label></div>');
            });

            if(data.actTurn === user.login && data.winner === ""){
                if(data.valueCards === null){
                   $("#value").show();
                }else
                    $("#value").hide();
                $("#info_turn").text("");
                $("#play_cards").show();
                $("#lier").show();
            }
            else{
                if(data.winner === "")
                    $("#info_turn").text("Aún no es tu turno");
                else
                    $("#info_turn").text(data.winner + " ha ganado la partida");
                $("#value").hide();
                $("#play_cards").hide();
                $("#lier").hide();
            }
            getHistory();
        },
        error: function(jqXHR, statusText, errorThrown) {
            alert("Error actualizando la partida");
        }
    });
}

function getHistory(){
    $.ajax({
        type: "GET",
        url: "/games/history",
        data: {id: idP},
        beforeSend: function (req) {
            req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
        },
        success: function(data, statusText, jqXHR){
            $("#history tbody tr").remove();
            data.history.forEach(element => {
                let result1 = $("<tr>");
                let result2 = $("<tr>")
                let row = element.hora;
                let date = row.split("T")[0];
                let hour = row.split("T")[1].split(".")[0];
                let format = (date + " | " + hour);
                //result1.append("<td>" + date + " | " + hour + "</td>");
                result2.append("<td>" + element.evento + "<br><br>" + format + "</td>");
                //$("#tHistory").append(result1);
                $("#tHistory").prepend(result2);
            });
        },
        error: function(jqXHR, statusText, errorThrown) {
            alert("Error obteniendo historial");
        }
    });
}

function playersToDOM(list){
    list.forEach(elem => {
        let result = $("<tr>");
        result.append("<td>" + elem.login + "</td>");
        result.append("<td>--</td>");
        $("#tPlayers").append(result);
    });
}

function otherToDOM(list, turn){
    list.forEach(elem => {
        let result = $("<tr>");
        result.append("<td>" + elem.player + "</td>");
        result.append("<td>" + elem.cards.length + "</td>");
        if(elem.player === turn){
            result.css("background", "chartreuse");
        }
        $("#tPlayers").append(result);
    });
}

/**
 * Esta parte se refiere a cuando se pulsa el botón de actualizar partida
 * que hay que intentar porner la parte de success en otra función
 * ya que tanto actualizar como pinchar en una pestaña
 * hacen lo mismo
 * @param {*} event 
 */
function updateGame(event){
    $.ajax({
        type: "GET",
        url: "games/update",
        contentType: "application/json",
        data: {id: idP},
        beforeSend: function (req) {
            $("#tPlayers").empty();
            req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
        },
        success: function(data, statusText, jqXHR){
            if(data.players.length < 4)
                playersToDOM(data.players);
            else
                showStatusGames();
        },
        error: function(jqXHR, statusText, errorThrown) {
            alert("Error interno del servidor. No se ha podido obtener la información de la partida");
        }
    });
}

function logout(event){
    cadenaBase64 = "";
    user = {login: "", id: null};
    idP = null;
    $("#welcome").show();
    $("input[name=user_name]").val("");
    $("input[name=user_pwd]").val("");
    $(".error").hide();
    $("#game_list li").remove();
    $("#game_list").append('<li class="nav-item"><a class="nav-link active partida" id="principal" data-id="0" data-toggle="tab" href="#">Mis partidas</a></li>');
    $("#game").hide();
    $("#nick").text("");
    $("#logout").hide();
    $("#view_game").hide();
    tab = $("a.nav-link.active");
}

function newGame(event){
    let name = $("input[name=game_name]").val();
    if(name===""){
        alert("Indica el nombre de la partida!");
    }else{
    $.ajax({
        type: "PUT",
        url: "/games/newGame",
        contentType: "application/json",
        data: JSON.stringify({
            game: name,
            idU: user.id
        }),
        beforeSend: function (req) {
            req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
        },
        success: function(data, statusText, jqXHR){
            alert("Se ha creado la partida correctamente.");
            console.log(data);
            let elem = $("<li class='nav-item'><a class='nav-link partida' data-toggle='tab' href='#' data-id='" + data.result + "' data-name='" + name + "'>" + name + "</a></li>");
            $("#game_list").append(elem);
        },
        error: function(jqXHR, statusText, errorThrown) {
            alert("Error creando la partida");
        }
    });
    }
}

function findGame(event){
   
    let id = Number($("input[name=game_id]").val());
    console.log(id);
    if(id === 0){
        alert("Indica el identificador de la partida!");
    }else{
        $.ajax({
            method: "PUT",
            url: "/games/newPlayer",
            contentType: "application/json",
            data: JSON.stringify({
                idPartida: id,
                idUsuario: user.id,
                log: user.login
            }),
            beforeSend: function (req) {
                req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
            },
            success: function(data, statusText, jqXHR){
                alert("Correcto: formas parte de la partida.");
                let elem = $("<li class='nav-item'><a class='nav-link partida' data-toggle='tab' href='#' data-id='" + id + "' data-name='" + data.name + "'>" + data.name + "</a></li>");
                $("#game_list").append(elem);

            },
            error: function(jqXHR, statusText, errorThrown) {
                switch (jqXHR.status){
                    case 400:
                    alert("No se ha podido unir. La partida ya está completa o ya pertenece a ella.");
                    break;
                    case 404:
                    alert("No existe ninguna partida con el identificador: " + id);
                    break;
                    case 500:
                    alert("No ha sido posible añadirte a la partida, error: " + errorThrown);
                    break;
                }
            }
        });
    }   
}

function loginUser(event) {

    let log = $("input[name=user_name]").val();
    let pass = $("input[name=user_pwd]").val();
    tab = $("a.nav-link.active");

    $.ajax({
            method: "POST",
            url: "/login",
            data: {
                login: log,
                pwd: pass
            },
            success: function(data, statusText, jqXHR){
                if(data.correct){
                    games(log, pass, data.id);
                }else{
                    $("#pwd_error").text("El usuario y/o contraseña no son correctos.");
                    $("#pwd_error").show();
                }
            },
            error: function(jqXHR, statusText, errorThrown) {
                if(jqXHR.status === 400){ 
                    let list = jqXHR.responseJSON.errors;
                    if(list.login !== undefined){
                        $("#login_error").text(list.login.msg);
                        $("#login_error").show();
                    }
                    if(list.pwd !== undefined){
                        $("#pwd_error").text(list.pwd.msg);
                        $("#pwd_error").show();
                    }
                }
                if(jqXHR.status === 500){
                    $("#pwd_error").text(errorThrown);
                    $("#pwd_error").show();
                } 
            }
        });

    event.preventDefault();
}


function newUser(event) {
    let log = $("input[name=user_name]").val();
    let pass = $("input[name=user_pwd]").val();
    tab = $("a.nav-link.active");

    $.ajax({
            method: "PUT",
            url: "/newUser",
            data: {
                login: log,
                pwd: pass
            },
            success: function(data, statusText, errorThrown){
                games(log, pass, data.id);
            },
            error: function(jqXHR, statusText, errorThrown) {
                if(jqXHR.status === 400){ 
                    let list = jqXHR.responseJSON.errors;
                    if(list !== undefined){
                        if(list.login !== undefined){
                            $("#login_error").text(list.login.msg);
                            $("#login_error").show();
                        }
                        if(list.pwd !== undefined){
                            $("#pwd_error").text(list.pwd.msg);
                            $("#pwd_error").show();
                        }
                    }else{
                        $("#pwd_error").text(jqXHR.responseJSON.msg);
                        $("#pwd_error").show();
                        
                    }
                }
                if(jqXHR.status === 500){
                    $("#pwd_error").text(errorThrown);
                    $("#pwd_error").show();
                } 
            }
    });
    event.preventDefault();
}

function games(log, pass, idU){
    user.login = log;
    user.id = idU;
    cadenaBase64 = btoa(log + ":" + pass);
    $("#welcome").hide();
    $("#nick").text(log);
    $("#logout").show();
    $("#my_games").show();
    getGames();
}

function getGames(){
  
    $.ajax({
        method: "GET",
        url: "/user/games",
        data: {
            idU: user.id
        },
        beforeSend: function (req) {
            req.setRequestHeader("Authorization", "Basic " + cadenaBase64);
        },
        
        success: function(data, statusText, jqXHR){

            let t = "";
            $("#game").show();
            data.result.forEach(element => {
                let elem = $("<li class='nav-item'><a class='nav-link partida' data-toggle='tab' href='#' data-id='" + element.id + "' data-name='" + element.nombre + "'>" + element.nombre + "</a></li>");
                $("#game_list").append(elem);
            });

        },
        error: function(jqXHR, statusText, errorThrown) {
            switch (jqXHR.status){
                case 403:
                    alert("Problemas de autenticación");
                break;
                case 500:
                    alert("No ha sido posible añadirte a la partida, error: " + errorThrown);
                break;
            }
        }
    });

}
