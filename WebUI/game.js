function gameFactory(name, canvas) {
    var game = {};

    game.canvas = canvas;
    game.ctx = game.canvas.getcontext('2d');
    game.name = "";
    game.playerSpecies = {};
    game.api = apiFactory();

    game.clickables = [];

    game.space = {
        width: 900,
        height: 900,
        centerx: 450,
        centery: 450,
        grid: 128,
        sunStartx: 80,
        sunStarty: 850,
        sun: 50,
        treeOffset: 50,
    };

    game.state = {};

    // Interactive functions
    game.refresh = function () {
        get(this.name).then(response => {
            this.state = response;
            console.log(state);
        });
    };

    game.click = function(x, y){
        var ci, c;
        for (ci in this.clickables){
            c = this.clickables[ci];
            if (this.distance(x, y, c.x, c.y) <= c.r){
                c.click();
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
        this.ctx.drawImage('img/boards/board.png', 0, 0);
    }

    game.renderSun = function(){
        var angle = this.state.sunAngle;
        var cx = this.space.width/2;
        var cy = this.space.height/2;
        var dirx = Math.sin(Math.PI/3*angle/6);
        var diry = Math.cos(Math.PI/3*angle/6);
        this.ctx.fillStyle = this.ctx.createGradient(cx*(1+dirx), cy*(-diry), cx*(!-dirx), cy*(1-diry));
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 2*Math.PI);
        this.ctx.stroke();
    }

    this.renderTrees = function(){
        for (i=0; i<this.state.board.length; i++){
            for(j=0; j<this.state.board[i].length; i++){
                if (this.state.board[i][j].player !== null){
                    var t = this.state.board[i][j];
                    var x = this.space.centerx + j; ///////////////// wrong
                    var y = this.state.centery + i;
                    this.ctx.drawImage(`img/trees/${this.playerSpecies[t.player]+t.treeLevel.toString()}.png`, x, y);
                }
            }
        }
    }

    this.renderShadows = function(){
        for (i=0; i<this.state.board.length; i++){
            for(j=0; j<this.state.board[i].length; i++){
                if (this.state.board[i][j].player !== null){
                    this.ctx.fillStyle = this.ctx.createGradient();
                }
            }
        }
    }

    // Helpers
    game.distance = function(x1, y1, x2, y2){
        return Math.pow(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2), 0.5);
    }

    // Setup
    var r = game.space.grid;
    for (i=0; i<game.state.board.length; i++){
        for(j=0; j<game.state.board[i].length; i++){
            var x;
            var y;
            game.clickables.push({
                i: i,
                j: j,
                x: x,
                y: y,
                r: r,
                click: function(){
                    this.api.grow(this.name, [i, j], null).then(function(r){
                        if (r.error == undefined){
                            alert("success");
                        }else{
                            alert(r.error.code);
                        }
                    });
                },
            });
        }
    }
    setInterval(game.refresh, 500); // Refresh game state every half second
    setInterval(game.render, 100);

    canvas.addEventListener("click", e=>{ // Send along all clicks
        this.click(e.x, e.y);
    });

    return game;
}