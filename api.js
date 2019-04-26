var express = require('express');
var main = require("./main.js");
var cookie = require('cookie-parser');
var bodyParser = require('body-parser');

var consts = {
    idlen: 10,
    playerIdLen:20
}
var app = express();
app.use(cookie());
app.use(bodyParser.json());
var gameStats = {}; // {id:{name: , slotsLeft: , slotsTaken: }}  Add give cookie
var games = []; // {id: game}
var gameCookies = {}; // {cookie: id, id:  cookie}
var players = {};
var game, cookie, gameid, playerCookie;
app.listen(8000, () => { console.log("started"); });

app.get('/games', function(req, res, next){
    res.json(gameStats);
});

app.post('/start', function (req, res, next) {
    //console.log(req.body.players);
    game = main.makeGame(req.body.players); // {players: [{name:"ellie"}, {name:"ora"}], name:"myGameName"}
    //console.log(game);
    cookie = makeid(consts.idlen);
    gameid = games.length;
    games[gameid] = game;
    gameCookies[gameid] = cookie;
    gameCookies[cookie] = gameid;
    gameStats[gameid] = {name:req.body.name, slotsLeft: req.body.players.length, slotsTaken: 0};
    res.cookie("gameCookie", cookie);
    res.json(game.state);
});

app.put('/join', function(req, res, next){
    gameid = req.body.gameId;
    if (games[gameid]){
        if (gameStats[gameid].slotsLeft > 0){
            playerCookie = makeid(consts.playerIdLen);
            players[playerCookie] = gameStats[gameid].slotsTaken;
            players[gameStats[gameid].slotsTaken] = playerCookie;
            gameStats[gameid].slotsLeft -=1;
            gameStats[gameid].slotsTaken += 1;
            res.cookie("playerCookie", playerCookie);
            res.json(game.state);
        }else{
            res.status(403);
            res.json({error:{code:"NoSpaceInGame"}});
        }
    }else{
        res.status(404);
        res.json({error:{code:"NoGame"}});
    }
});

app.get('/state', function(req, res, next){
    gameid = gameCookies[req.cookies.gameCookie];
    player = players[req.cookies.playerCookie];
    if (!(gameid===undefined || player===undefined)){
        game = games[gameid];
        res.json(game.state);
    }else{
        res.status(403);
        res.json({error:{code:"NotInGame"}});
    }
});

app.put('/action', function(req, res, next){
    gameid = gameCookies[req.cookies.gameCookie];
    player = players[req.cookies.playerCookie];
    if (!(gameid===undefined || player===undefined)){
        game = games[gameid];
        var r = game.takeAction(player, req.body); 
        res.json(r);
    }else{
        res.json({error:{code:"notInGame"}});
        res.status(403);
    }
});

app.put('/endturn', function(req, res, next){
    gameid = gameCookies[req.cookies.gameCookie];
    player = players[req.cookies.playerCookie];
    if (!(gameid===undefined || player===undefined)){
        game = games[gameid];
        if (game.endTurn(player)){
            if (game.state.done){
                res.json(game.state);
                endGame(gameid);
            }
        }else{
            res.status(403);
            res.json({error:{code:"TurnError"}});
        }
    }else{
        res.status(403);
    }
});

app.delete('/finish', function(req, res, next){
    gameid = gameCookies[req.cookies.gameCookie];
    player = players[req.cookies.playerCookie];
    if (!(gameid===undefined || player===undefined)){
        game = games[gameid];
        endGame(gameid);
        req.json({message:"game removed"});
    }
    req.status(404);
});

function endGame(id){
    cookie = gameCookies[id];
    delete gameCookies[id];
    delete gameCookies[cookie];
    delete gameStats[id];
    games.splice(id, 1);
}

function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}