var gameState, canvas, c2d, height, width, side, boardSpace, playerSpecies;
height=300;
width=400;
playerSpecies = ["Maple", "Oak", "Linden", "Spruce"];
boardSpace = [75, 300, 250, 300];
canvas = document.getElementById("game");
c2d = canvas.getContext("2d");

function drawTile(y, x, leaves, player, treeLevel){
    ctx.beginPath();
    ctx.arc(240, 160, 20, 0, Math.PI*2, false);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.closePath();
}

function drawBase(){

}

function drawBoard(){

}

//draw opponent state
function drawOpponentState(player){
    
}

//Draw my stuff
function drawMyStore(){

}

function drawMyAvailable(){

}

function drawMySun(){

}

function drawMyPoints(){

}