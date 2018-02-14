"use strict";

function iniGame(players, descartes){
    let baraja = [];
    let p = [];
    let orden = [];
    let length = 52;

    //REPARTIMOS CARTAS
    for(let i = 0; i < 4; i++){
        p[players[i].login] = [];
    }

    for(let i = 0; i < 52; i++){
        baraja.push(i);
    }

    for(let i = 0; i < 52; i++){
        let pos = Math.floor(Math.random() * length);
        length--;

        let c = baraja[pos];
        let car = "";
        switch(Math.floor(c % 13) + 1){//Obtenemos cara
            case 1:
                car = "A";
            break;
            case 11:
                car = "J";
            break;
            case 12:
                car = "Q";
            break;
            case 13:
                car = "K";
            break;
            default:
                car = String(Math.floor(c % 13) + 1);
            break;
        }
        let pal = "";
        switch (Math.floor(c / 13)){//Obtenemos palo
            case 0:
                pal = "D";
                break;
            case 1:
                pal = "H";
                break;
            case 2:
                pal = "C";
                break;
            case 3:
                pal = "S";
                break;
        }

        let carta = { cara: car, palo: pal};
        let name= Math.floor(i / 13);//jugador

        p[players[name].login].push(carta);//le damos carta
        baraja.splice(pos, 1);
    }

    //DAMOS UN ORDEN
    for(let i = 0; i < 4; i++){
        let j = Math.floor(Math.random() * players.length);

        let id = players[j].login;

        orden.push(id);
        players.splice(j, 1);
        quitRepeatCards(p[orden[i]], descartes, id);
    }
    
    let info = { playerCards: [{player: orden[0], cards: p[orden[0]]},
                                {player: orden[1], cards: p[orden[1]]},
                                {player: orden[2], cards: p[orden[2]]},
                                {player: orden[3], cards: p[orden[3]]}],                    
                 playedCards: [], valueCards: null, lastMove: {player: "", move: []}, winner: "",turns: orden, actTurn: orden[0]};

    return JSON.stringify(info);
}

function addCards(list, cards){
    for(let i = 0; i < cards.length; i++){
        list.push(cards[i]);
    }
}

function quitRepeatCards(list, d, id){
    let p = {p: id, v: null};
    let posiciones = [];
    let cont = 1;
    let i = 0;


    list.forEach(element => {
        posiciones.push(i);
        for(let j = i+1; j < list.length; j++){
            if(list[j].cara == element.cara){
                posiciones.push(j);
                cont++;
            }
        }

        if(cont === 4){
            p.v = element.cara;
            d.push(p);
            for(let j = 0; j < 4; j++){
                list.splice(posiciones[j] - j , 1);
            }
        }

        posiciones = [];
        p = {p: id, v: null};
        cont = 1;
        i++;
    });
}

function quitCards(cards, playCards){
    for(let i = 0; i < playCards.length; i++){
        for(let j = 0; j < cards.length; j++){
            if(playCards[i].cara == cards[j].cara && playCards[i].palo == cards[j].palo){
                cards.splice(j, 1);
            }
        }
    }
}

function getCardsPlayer(list, player){
    let cards = [];
    list.forEach(element => {
        if(element.player === player)
            cards = element.cards;
    });
    return cards;
}

module.exports = {
    iniGame: iniGame,
    addCards: addCards,
    quitRepeatCards: quitRepeatCards,
    quitCards: quitCards,
    getCardsPlayer: getCardsPlayer
};