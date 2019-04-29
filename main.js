// Y then X
module.exports.makeGame = function (players) {
    game = {};
    game.state = initState(players);

    // Visible functions

    game.grow = function (player, position, source) {
        if (this.state.preRound == 0) {
            if (player == this.state.activePlayer) {
                var tile = this.getTile(position);
                var player = this.state.players[player];
                if (!((tile.player && tile.player !== player) ||
                    this.state.usedTiles[position] !== undefined)) {

                    var cost = 0;
                    cost += config.costToBuy[tile.treeLevel][player.available[tile.treeLevel]];
                    cost += tile.treeLevel + 1;
                    if (cost <= player.sun) {

                        if (player.available[tile.treeLevel] > 0) {

                            if (!(tile.treeLevel == 0 && !(this.canReach(position, source)))) {

                                player.sun -= cost; // pay

                                if (tile.treeLevel == 0) { // Change board
                                    player.available[0] -= 1;
                                    tile.player = player;
                                } else if (tile.treeLevel != 3) {
                                    player.available[tile.treeLevel] += 1;
                                    tile.treelevel += 1;
                                    player.available[tile.treeLevel] -= 1;
                                } else {
                                    player.tokens.push(this.state.yields[tile.leaves].pop());
                                    tile.player = null;
                                }

                                if (player.sun == 0) { // End turn if you are out of sun
                                    this.endTurn(player);
                                }

                                return { success: true };
                            }
                            return { error: { code: "CannotReach" } };
                        }
                        return { error: { code: "NotAvailable" } };
                    }
                    return { error: { code: "CannotAfford" } };
                }
                return { error: { code: "BelongsToAnother" } };
            }
            return { error: { code: "NotYourTurn" } };
        }
        return { error: { code: "PreRound" } };
    };

    game.endTurn = function (player) {
        if (player == this.state.activePlayer) {
            this.state.usedTiles = {};
            this.state.activePlayer = (this.state.activePlayer + 1) % this.state.players.length;
            this.state.hasStartingToken = (this.state.hasStartingToken + 1) % this.state.players.length;            
            if (this.state.activePlayer == 0) { // Sun rotates
                if (this.state.preRound > 0) { // Pre round
                    this.state.preRound -= 1;
                }
                if (this.state.preRound == 0){ // Not pre round
                    this.gatherSun();
                    this.state.sunAngle = (this.state.sunAngle + 1) % 6;
                    if (this.state.sunAngle == 0) { // Sun returned to start
                        this.state.sunCycle -= 1;
                        if (this.state.sunCycle == 0) { // Game ends
                            for (p in this.state.players) {

                                // Find out who wins
                                var player = this.state.players[p];
                                player.points = 0;
                                for (t in player.tokens) {
                                    player.points += player.tokens[t];
                                }
                                var lps = 0;
                                for (lp in config.lightPoints) {
                                    if (config.lightPoints[lp] > lps && lp <= player.sun) {
                                        lps = config.lightPoints[lp];
                                    }
                                }
                                player.points += lps;
                            }
                            this.state.winner = { player: null, score: 0 };
                            for (p in this.state.players) {
                                if (this.state.winner.score < this.state.players[p].points) {
                                    this.state.winner.player = p;
                                    this.state.winner.score = this.state.players[p].points;
                                }
                            }
                            // Game over
                        }
                    }
                }
            }
            return { success: true };
        }
        return { error: { code: "NotYourTurn" } };
    }

    game.setupPut = function (player, position) {
        if (this.state.preRound > 0) {
            if (player == this.state.activePlayer) {
                var tile = this.getTile(position);
                if (tile.player === null) {
                    tile.player = player;
                    tile.treeLevel = 1;
                    this.state.players[player].available[1] -= 1;

                    this.endTurn(player); // End turn immediately after each setup put
                    return {success: true};
                }
                return { error: { code: "BelongsToAnother" } };
            }
            return { error: { code: "NotYourTurn" } };
        }
        return { error: { code: "OnlyPreRound" } };
    }

    // Helper functions 
    game.gatherSun = function () {
        var i, j;
        // Collect sun
        for (i = 0; i < this.state.board.length; i++) {
            for (j = 0; j < this.state.board[i].length; j++) {
                var t = this.getTile([i, j]);
                if (!(t.player == null)) {
                    if (!(t.shade && t.treeLevel <= t.shade)) {
                        this.state.players[t.player].sun += t.treeLevel;
                    }
                }
            }
        }
    };

    game.castShade = function (source) {
        var angle = this.state.sunAngle;
        var i, j, target;
        if (source) {
            var t = this.getTile(source);
            for (i = 0; i < t.treeLevel; i++) {
                target = this.getOffset(source, angle, t.treeLevel);
                if (target) {
                    this.getTile(target).shade = t.treeLevel;
                }
            }
        } else {
            for (i = 0; i < this.state.board.length; i++) {
                for (j = 0; j < this.state.board[i].length; j++) {
                    this.getTile([i, j]).shade = 0;
                }
            }
            for (i = 0; i < this.state.board.length; i++) {
                for (j = 0; j < this.state.board[i].length; j++) {
                    t = this.getTile([i, j]);
                    if (t.treeLevel > 0) {
                        target = this.getOffset([i, j], angle, t.treeLevel);
                        if (target) {
                            this.getTile(target).shade = t.treeLevel;
                        }
                    }
                }
            }
        }
    };

    game.getOffset = function (source, direction, distance) {
        var side = config.side;
        var target, y, x, split, width;
        if (angle == 1 || angle == 4) {
            target = [source[0], source[1] + distance * (direction - 2)];
            if (target[1] >= 0 && target[1] < this.state.board[target[0]].length) {
                return target;
            } else {
                return false;
            }
        } else if (angle == 0 || angle == 2) {
            split = 1 - direction;
            y = source[0] + distance * (-split);
            x = source[1];
            x -= Math.max(0, split * (side - x)) - Math.max(0, split * (side - source[0]));
            target = [y, x];
            width = this.state.board[y].length;
            if (x >= 0 && x < width && y >= 0 && y < width) {
                return target;
            } else {
                return false;
            }
        } else if (angle == 3 || angle == 5) {
            split = direction - 4;
            y = source[0] + distance * (4 - direction);
            x = source[1];
            x -= Math.max(0, split * (side - x)) - Math.max(0, split * (side - source[0]));
            target = [y, x];
            width = this.state.board[y].length;
            if (x >= 0 && x < width && y >= 0 && y < width) {
                return target;
            } else {
                return false;
            }
        }
        return false;
    };

    game.getTile = function (s) {
        return this.state.board[s[0]][s[1]];
    };

    game.canReach = function (source, target) {
        var length = this.getTile(source).treeLevel;
        for (var i = 0; i < 6; i++) {
            for (var j = 1; j <= length; j++) {
                if (this.getOffset(source, i, j) == target) {
                    return true;
                }
            }
        }
        return false;
    };

    return game;
};

function createTile(leaves = 1) {
    tile = {};
    tile.player = null;
    tile.treeLevel = 0;
    tile.leaves = leaves;
    tile.shade = 0;
    return tile;
}

function createBoard() {
    var side = config.mapSize;
    var i, j, width, leaves, max;

    board = [];
    for (i = 0; i < 2 * side - 1; i++) {
        width = 7 - Math.abs(i - side + 1);
        max = side - Math.abs(side - 1 - i);
        board.push([]);
        for (j = 0; j < width; j++) {
            leaves = Math.min(max, Math.floor(1 + width / 2 - Math.abs(-(width - 1) / 2 + j)));
            board[i].push(createTile(leaves));
        }
    }
    return board;
}

function createPlayer() {
    var totals = config.resources;

    var player = {};
    player.tokens = [];
    player.sun = 0;
    player.available = [
        totals.seeds,
        totals.level1Trees,
        totals.level2Trees,
        totals.level3Trees,
    ];

    return player;
}

function initState(players) {
    var maxPlayers = config.maxPlayers;
    var minPlayers = config.minPlayers;
    var maxSuns = config.sunsByPlayers[players];
    var yields = config.yields;

    console.assert(players <= maxPlayers && players >= minPlayers, "too many players");
    gameState = {};
    gameState.board = createBoard();

    gameState.players = [];
    for (var i = 0; i < players; i++) {
        gameState.players.push(createPlayer());
    }

    gameState.yields = JSON.parse(JSON.stringify(yields))
    gameState.hasStartingToken = 0;
    gameState.sunAngle = 0;
    gameState.sunCycle = maxSuns;
    gameState.activePlayer = 0;
    gameState.preRound = 2; //turnPhases are prePerimeterTrees, build
    gameState.usedTiles = {};
    return gameState;
}

config = {
    mapSize: 4,
    resources: {
        seeds: 6,
        level1Trees: 8,
        level2Trees: 4,
        level3Trees: 2,
    },
    // Cost to buy if player has i in inventory
    costToBuy: [
        [2, 2, 1, 1, 1, 1],
        [3, 3, 2, 2, 2, 2, 2, 2],
        [4, 3, 3, 3],
        [5, 4],
    ],
    yields: {
        1: [12, 12, 12, 12, 13, 13, 13, 14, 14],
        2: [13, 13, 14, 14, 16, 16, 17],
        3: [17, 17, 18, 18, 19],
        4: [20, 21, 22]
    },
    maxPlayers: 4,
    minPlayers: 2,
    sunsByPlayers: {
        2: 3,
        3: 4,
        4: 4
    },
    lightPoints: {
        3: 1,
        6: 2,
        9: 3,
        12: 4,
        15: 5,
        18: 6
    },
}