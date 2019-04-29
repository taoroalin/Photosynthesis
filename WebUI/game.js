function begin(name, canvas) {
    game.canvas = canvas;
    game.ctx = game.canvas.getcontext('2d');
    var game = {};
    game.state = {};

    game.clickables = {};

    // Interactive functions
    game.refresh = function () {
        get(name).then(response => {
            game.state = response;
            console.log(state);

        });
    };

    game.click = function(x, y){
        var ci, c;
        for (ci in clickables){
            c = clickables[ci];
            if (distance(x, y, c.x, c.y) <= c.r){
                c.event();
            }
        }
    }

    // Rendering
    game.render = function(){
        this.renderBackground();
        this.renderSun();
        this.renderTokens();
        this.renderTrees();
        this.renderShadows();
    };

    game.renderBackground = function(){
        this.ctx
    }

    // Helpers
    game.distance = function(x1, y1, x2, y2){
        return Math.pow(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2), 0.5);
    }

    // Setup

    setInterval(game.refresh, 500); // Refresh game state every half second

    canvas.addEventListener("click", e=>{ // Send along all clicks
        this.click(e.x, e.y);
    });

    return game;
}
var gameState, canvas, c2d, height, width, side, boardSpace, playerSpecies;
height = 300;
width = 400;
playerSpecies = ["Maple", "Oak", "Linden", "Spruce"];
boardSpace = [75, 300, 250, 300];
canvas = document.getElementById("game");
c2d = canvas.getContext("2d");

function drawTile(y, x, leaves, player, treeLevel) {
    ctx.beginPath();
    ctx.arc(240, 160, 20, 0, Math.PI * 2, false);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.closePath();
}

function drawBase() {

}

function drawBoard() {

}

//draw opponent state
function drawOpponentState(player) {

}

//Draw my stuff
function drawMyStore() {

}

function drawMyAvailable() {

}

function drawMySun() {

}

function drawMyPoints() {

}