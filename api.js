var express = require('express');
var main = require("./main.js");
var cookie = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var consts = {
    idlen: 50,
    maxPlayers: 4,
    minPlayers: 2
};

var app = express();
app.use(cookie());
app.use(bodyParser.json());
app.use(cors({origin: true, credentials:true}));

var games = {};
var lobby = {};
var cookies = {};
var game, lobby, player, cookieEntry, gameCookie, playerCookie, name;

app.listen(8000, () => { console.log("started"); });

app.options(/.*/, function (req, res) {
    res.set('content-type', '*/*');
    res.set('Access-Control-Allow-Origin', '');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
});

app.get('/games', function (_, res) {
    res.json(lobby);
});

app.post('/add', function (req, res) {
    console.log(req.body);
    if (lobby[req.body.name] === undefined) {

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

app.put('/join', function (req, res) {
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

app.put('/start', function (req, res) {
    name = req.body.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, true, req.body.cc);
    if (player !== false) {
        lobby[name].stage = "playing";
        game = main.makeGame(lobby[name].players.length);
        games[name] = game;
        res.json(game);
    }
});

app.get('/state', function (req, res) {
    name = req.query.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, false, req.body.cc);;
    if (player !== false) {
        game = games[name];
        res.json(game.state);
    }
});

app.put('/grow', function (req, res) {
    name = req.body.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, false, req.body.cc);
    if (player !== false) {
        game = games[name];
        var r = game.grow(player, req.body.position, req.body.source);
        res.json(r);
    }
});

app.put('/endturn', function (req, res) {
    name = req.body.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, false, req.body.cc);
    if (player !== false) {
        game = games[name];
        var r = game.endTurn(player, req.body.position);
        res.json(r);
    }
});

app.put('/setupput', function (req, res) {
    name = req.body.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, false, req.body.cc);
    if (player !== false) {
        game = games[name];
        var r = game.setupPut(player, req.body.position);
        res.json(r);
    }
});

app.delete('/finish', function (req, res) {
    name = req.body.name;
    gameCookie = req.cookies.gameCookie;
    playerCookie = req.cookies.playerCookie;
    player = accessGame(name, gameCookie, playerCookie, res, false, req.body.cc);
    if (player !== false) {
        delete cookies[nm];
        delete games[nm];
        delete lobby[nm];
        res.json({ success: true });
    }
});

function accessGame(nm, gc, pc, res, st, cc) {
    if (lobby[nm] !== undefined && (games[nm] !== undefined || st)) {
        if (cookies[nm].cookie == gc) {
            if (cc !== undefined) {
                return cc;
            }
            for (apc in cookies[nm].players) {
                if (pc == cookies[nm].players[apc]) {
                    return apc;
                }
            }
        }
        res.status(403);
        res.json({ error: { code: "NotInGame" } });
    } else {
        res.status(404);
        res.json({ error: { code: "NoGame" } });
    }
    return false;
}

function makeid() {
    var length = consts.idlen;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}