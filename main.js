// Y then X
module.exports.makeGame = function (players) {
    game = {};
    game.state = initState(players);
    game.constants = constants;
    game.config = config;

    // Visible functions
    game.endTurn = function (player) {
        if (player == this.state.activePlayer) {
            if (this.state.preRound <= 0) {
                var rotate = this.config.alternateTurnStart;
                this.state.turnNumber += 1;
                this.state.sunAngle = (this.state.sunAngle + 1) % 6;
                if (this.sunAngle == 0) {
                    this.state.sunCycle -= 1;
                    if (rotate) {
                        this.state.hasStartingToken = (this.state.hasStartingToken + 1) % this.state.players.length;
                        this.state.activePlayer = this.state.hasStartingToken;
                    } else {
                        this.state.activePlayer = (this.state.activePlayer + 1) % this.state.players.length;
                    }

                    if (this.state.sunCycle < 0) {
                        this.state.done = true;
                        return;
                    }
                } else {
                    this.state.activePlayer = (this.state.activePlayer + 1) % this.state.players.length;
                }
                this.castShade();
                this.gatherSun();
            }
            return { error: { code: "PreRound" } };
        }
        return { error: { code: "TurnError" } };
    }

    game.takeAction = function (player, action) {
        if (player != this.state.activePlayer) {
            return { error: { code: "TurnError" } };
        } 
        if (this.state.preRound > 0) {
            var source = action.source;
            console.log(this.getTile(source));
            if (!(this.getTile(source).player===null)){
                var tl = this.getTile(source);
                tl.treeLevel = 1;
                tl.player = player;
                tl.lastUsedBy = player;
                this.state.activePlayer = (this.state.activePlayer+1)%this.state.players.length;
                if (this.state.activePlayer == 0){
                    this.state.preRount -=1;
                }
                return this.state;
            }
            return {error: {code:"TileOccupied"}};
        } else {
            var a = this.action(player, action);
            if (a.success) {
                return this.state;
            } else {
                return a.error;
            }
        }
    };

    // Backend functions
    game.action = function (player, action) {
        if (action.type == "plant") {
            if (this.canPlantSeed(player, action.source, action.target)) {
                this.plant(player, action.source, action.target);
            } else {
                return { success: false, error: { error: { code: "CannotPlant" } } };
            }
        } else if (action.type == "grow") {
            if (this.canUpgrade(player, action.source)) {
                this.upgrade(player, action.source);
            } else {
                return { success: false, error: { error: { code: "CannotUpgrade" } } };
            }
        } else if (action.type == "retire") {
            if (this.canRetire(player, action.source)) {
                this.upgrade(player, action.source);
            } else {
                return { success: false, error: { error: { code: "CannotRetire" } } };
            }
        } else if (action.type == "buy") {
            if (this.canPlantSeed(player, action.item)) {
                this.purchase(player, action.item);
            } else {
                return { success: false, error: { error: { code: "CannotBuy" } } };
            }
        }
        return { success: false, error: { error: { code: "InvalidAction" } } };
    };

    game.canPlantSeed = function (player, source, target) {
        var reach = false;
        var length = this.getTile(source).treeLevel;
        for (var i = 0; i < 6; i++) {
            for (var j = 1; j <= length; j++) {
                if (this.getOffset(source, i, j) == target) {
                    reach = true;
                    break;
                }
            }
            if (reach) break;
        }
        return (this.getTile(source).player == player &&
            this.state.players[player].sun > 1 &&
            this.state.players[player].available[0] > 0 &&
            this.getTile(target).player === null &&
            this.getTile(target).lastUsedTurn < this.state.turnNumber &&
            this.getTile(source).lastUsedTurn < this.state.turnNumber &&
            reach);
    };

    game.plant = function (player, source, target) {
        var cost = this.config.plantSeedCost;
        this.state.players[player].changeSun(-cost);
        this.getTile(source).lastUsedTurn = this.state.turnNumber;
        this.getTile(target).lastUsedBy = player;
        this.getTile(target).lastUsedTurn = this.state.turnNumber;
        this.getTile(target).treeLevel = 0;
        this.getTile(target).player = player;
        this.state.players[player].available[0] -= 1;
    };

    game.canUpgrade = function (player, source) {
        var costs = this.config.upgradeFromCost;
        return this.getTile(source).player == player &&
            this.getTile(source).treeLevel < 3 &&
            this.getTile(source).lastUsedTurn < this.state.turnNumber &&
            this.state.players[player].sun >= costs[this.getTile(source).treeLevel] &&
            this.state.players[player].available[this.getTile(source).treeLevel + 1] > 0;
    };

    game.upgrade = function (player, source) {
        var costs = this.config.upgradeFromCost;
        this.state.players[player].changeSun(-costs[this.getTile(source).treeLevel]);
        this.getTile(source).lastUsedTurn = this.state.turnNumber;
        this.getTile(source).treeLevel += 1;
        this.state.players[player].available[this.getTile(source).treeLevel] -= 1;
        this.state.players[player].store[this.getTile(source).treeLevel - 1] += 1;
    };

    game.canPurchase = function (player, item) {
        var costToBuy = this.config.costToBuy;
        return item < 4 &&
            item >= 0 &&
            this.state.players[player].playerBoard[item] > 0 &&
            this.state.players[player].sun >= costToBuy[state.players[player].playerBoard[item] - 1];
    };

    game.purchase = function (player, item) {
        var costToBuy = this.config.costToBuy;
        this.state.players[player].changeSun(-costToBuy[item]);
        this.state.players[player].available[item] += 1;
        this.state.players[player].store[item] -= 1;
        this.state.players[player].playerBoard[item] -= 1;
    };

    game.canRetire = function (player, source) {
        var costToRetire = this.config.retireCost;
        return this.getTile(source).player == player &&
            this.getTile(source).lastUsedTurn < this.state.turnNumber &&
            this.getTile(source).treeLevel == 3 &&
            this.state.players[player].available[3] > 0 &&
            this.state.players[player].sun > costToRetire;
    };

    game.retire = function (player, source) {
        var costToRetire = this.config.retireCost;
        this.getTile(source) = 0;
        this.getTile(source).player = null;
        this.getTile(source).lastUsedTurn = this.state.turnNumber;
        this.getTile(source).treeLevel = 0;
        this.state.players[player].playerBoard[3] += 1;
        this.state.players[player].changeSun(-costToRetire);
        this.state.players[player].points += this.state.yields[this.getTile(source).leaves].pop();
        this.state.players[player].store[3] += 1;
    };

    // Helper functions 
    game.gatherSun = function () {
        var i, j;
        // Collect sun
        for (i = 0; i < this.state.board.length; i++) {
            for (j = 0; j < this.state.board[i].length; j++) {
                var t = this.getTile([i, j]);
                if (!(t.player == null)) {
                    if (!(t.shade && t.treeLevel <= t.shade)) {
                        this.state.players[t.player].changeSun(t.treeLevel);
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
        var side = this.config.side;
        var target, y, x;
        if (angle == 1 || angle == 4) {
            target = [source[0], source[1] + distance * (direction - 2)];
            if (target[1] >= 0 && target[1] < this.state.board[target[0]].length) {
                return target;
            } else {
                return false;
            }
        } else if (angle == 0 || angle == 2) {
            y = source[0] + distance * (direction - 1);
            x = source[1] - (Math.max(0, (1 - direction) * (side - x)) - Math.max(0, (1 - direction) * (side - source[0])));
            target = [y, x];
            if (x >= 0 && x < this.state.board[y].length && y >= 0 && y < this.state.board.length) {
                return target;
            } else {
                return false;
            }
        } else if (angle == 3 || angle == 5) {
            y = source[0] + distance * (4 - direction);
            x = source[1] - (Math.max(0, (direction - 4) * (side - x)) - Math.max(0, (direction - 4) * (side - source[0])));
            target = [y, x];
            if (x >= 0 && x < this.state.board[y].length && y >= 0 && y < this.state.board.length) {
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

    return game;
};

config = {
    mapSize: 4,
    totalResources: {
        seeds: 6,
        level1Trees: 8,
        level2Trees: 4,
        level3Trees: 2,
    },
    playerBoardResources: {
        seeds: 4,
        level1Trees: 4,
        level2Trees: 3,
        level3Trees: 2,
    },
    lightPoints: {
        3: 1,
        6: 2,
        9: 3,
        12: 4,
        15: 5,
        18: 6
    },
    // Cost to buy if player has i in inventory
    costToBuy: [
        [2, 2, 1, 1],
        [3, 3, 2, 2],
        [4, 3, 3],
        [5, 4],
    ],
    upgradeFromCost: [1, 2, 3],
    retireCost: 4,
    plantSeedCost: 1,
    alternateTurnStart: true,
    sunsByPlayers: {
        2: 3,
        3: 4,
        4: 4
    },
    harvestYields: {
        1: [12, 12, 12, 12, 13, 13, 13, 14, 14],
        2: [13, 13, 14, 14, 16, 16, 17],
        3: [17, 17, 18, 18, 19],
        4: [20, 21, 22]
    },
    skipLevel4WithPlayers: [2],
    maxPlayers: 4
}

constants = {

}

function createTile(leaves = 1) {
    tile = {};
    tile.player = null;
    tile.treeLevel = 0;
    tile.leaves = leaves;
    tile.lastUsedBy = null;
    tile.lastUsedTurn = -1;
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
            leaves = Math.min(max, Math.floor(1 + width / 2.0 - Math.abs(-(width - 1) / 2.0 + j)));
            board[i].push(createTile(leaves));
        }
    }
    return board;
}

function createPlayer(player) {
    var totals = config.totalResources;
    var inventory = config.playerBoardResources;
    var lightPoints = config.lightPoints;

    if (!player.name) player.name = "Guest";

    player.points = 0;
    player.sun = 0;
    player.playerBoard = {
        seeds: inventory.seeds,
        level1Trees: inventory.level1Trees,
        level2Trees: inventory.level2Trees,
        level3Trees: inventory.level3Trees,
    }
    player.available = {
        seeds: totals.seeds - inventory.seeds,
        level1Trees: totals.level1Trees - inventory.level1Trees,
        level2Trees: totals.level2Trees - inventory.level2Trees,
        level3Trees: totals.level3Trees - inventory.level3Trees,
    }

    player.changeSun = function (sun) {
        var origPoints = this.points;
        for (var i = lightPoints.length - 1; i >= 0; i--) {
            if (this.sun >= lightPoints[i]) {
                this.points -= lightPoints[i];
                break;
            }
        }
        this.sun += sun;
        for (var i = lightPoints.length - 1; i >= 0; i--) {
            if (this.sun >= lightPoints[i]) {
                this.points += lightPoints[i];
                break;
            }
        }
    }

    return player;
}

function initState(players) {
    var maxPlayers = config.maxPlayers;
    var maxSuns = config.sunsByPlayers[players.length];
    var yields = config.harvestYields;

    console.assert(players.length <= maxPlayers && players.length >= 2, "too many players");
    gameState = {};
    gameState.board = createBoard();

    gameState.players = players;
    for (var i = 0; i < players.length; i++) {
        createPlayer(players[i]);
    }

    gameState.yields = JSON.parse(JSON.stringify(yields))
    gameState.hasStartingToken = 0;
    gameState.sunAngle = 0;
    gameState.sunCycle = maxSuns;
    gameState.activePlayer = 0;
    gameState.preRound = 2; //turnPhases are prePerimeterTrees, build
    gameState.turnNumber = 0;
    gameState.done = false;
    return gameState;
}