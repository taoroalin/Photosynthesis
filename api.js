var express = require('express');
var main = require("./main.js");
var cookie = require('cookie-parser');
var bodyParser = require('body-parser');

var consts = {
    idlen: 50,
    maxPlayers: 4,
    minPlayers: 2
};

var app = express();
app.use(cookie());
app.use(bodyParser.json());

var games = {};
var lobby = {};
var cookies = {};
var game, lobby, cookieEntry, gameCookie, playerCookie, name;

app.listen(8000, () => { console.log("started"); });

app.get('/games', function (req, res, next) {
    res.json(lobby);
});

app.post('/add', function (req, res, next) {
    if (lobby[req.body.name] !== undefined) {

        lobbyGame = {}; // Make lobby entry
        lobbyGame.name = req.body.name;
        lobbyGame.players = [{ name: req.body.username }];
        lobbyGame.stage = "staging";
        lobby[req.body.name] = lobbyGame; // Add lobby entry to list

        playerCookie = makeid(); // Make cookie entry
        gameCookie = makeid();
        cookieEntry = { cookie: gameCookie, players: [playerCookie] };
        cookies[req.body.name] = cookieEntry; // Add cookies to cookie list

        res.cookie("gameCookie", gameCookie); // Return
        res.cookie("playerCookie", playerCookie);
        res.json(lobbyGame);
    } else {
        res.json({ error: { code: "NameAlreadyExists" } });
    }
});

app.put('/join', function (req, res, next) {
    name = req.body.name;
    if (lobby[name] !== undefined) {
        if (lobby[name].stage == "staging") {
            if (lobby[name].players.length < consts.maxPlayers) {
                playerCookie = makeid();
                lobby[name].players.push({ name: req.body.username });
                cookies[name].players.push(playerCookie);

                res.cookie("gameCookie", cookies[name].cookie); // Return
                res.cookie("playerCookie", playerCookie);
                res.json(lobby[name]);
            } else {
                res.status(404);
                res.json({ error: { code: "NoSlots" } });
            }
        } else {
            res.status(404);
            res.json({ error: { code: "GameStarted" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.put('/start', function (req, res, next) {
    name = req.body.name;
    if (lobby[name] !== undefined && lobby[name].stage == "staging") {
        if (cookies[name].cookie == req.cookies.gameCookie) {
            lobby[name].stage = "playing";
            game = main.makeGame(lobby[name].players.length);
            games[name] = game;
            res.json(game);
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.get('/state', function (req, res, next) {
    name = req.query.name;
    if (lobby[name] !== undefined && lobby[name].stage == "playing") {
        if (cookies[name].cookie == req.cookies.gameCookie){
            game = games[name];
            res.json(game.state);
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.put('/grow', function (req, res, next) {
    name = req.body.name;
    if (games[name] !== undefined) {
        if (cookies[name].cookie == req.cookies.gameCookie){
            game = games[name];
            var r = game.grow(player, req.body.position, req.body.source);
            res.json(r);
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.put('/endturn', function (req, res, next) {
    name = req.body.name;
    if (games[name] !== undefined) {
        if (cookies[name].cookie == req.cookies.gameCookie){
            game = games[name];
            var r = game.endTurn(player, req.body.position);
            res.json(r);
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.put('/setupput', function(req, res, next){
    name = req.body.name;
    if (games[name] !== undefined) {
        if (cookies[name].cookie == req.cookies.gameCookie){
            game = games[name];
            var r = game.setupPut(player, req.body.position);
            res.json(r);
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

app.delete('/finish', function (req, res, next) {
    name = req.body.name;
    if (games[name] !== undefined) {
        if (cookies[name].cookie == req.cookies.gameCookie){
            delete cookies[nm];
            delete games[nm];
            delete lobby[nm];
            res.json({success:true});
        } else {
            res.status(403);
            res.json({ error: { code: "NotInGame" } });
        }
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
});

function makeid() {
    var length = consts.idlen;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}