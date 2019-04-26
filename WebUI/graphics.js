function makeEngine(x = 1000, y = 750){
    var engine = {};
    
    // variables

    engine.totalTicks = 0;
    engine.x = x;
    engine.y = y;

    engine.rendererId = 0;
    engine.backgroundId = 0;
    engine.dynamicId = 0;
    engine.topId = 0;
    engine.colliderId = 0;

    engine.background = {};
    engine.backgroundChanges = [];
    engine.dynamic = {};
    engine.top = {};
    engine.colliders = {};

    // helper functions
    engine.distance = function(x1, y1, x2, y2){
        return Math.pow(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2), 0.5);
    };

    engine.checkCollision = function(c1, c2){
        return this.distance(c1.x, c1.y, c2.x, c2.y) < c1.radius + c2.radius;
    };

    // visible functions
    engine.tick = function(){
        var i, d, t, c, bch;

        while(this.backgroundChanges.length > 0){
            bch = this.backgroundChanges.pop(); ///////////////////////////////////////// I WAS HERE
        }

        for (i=0; i<this.dynamic.length; i++){
            d = this.dynamic[i];
            if (d.moving){
                d.x += d.dx;
                d.y += d.dy;
                d.render();
                if (d.collider !== undefined){
                    for (c in this.colliders){
                        if (this.checkCollision(this.colliders[c], d.collider)){
                            d.collider.onCollision(this.colliders[c]);
                            this.colliders[c].onCollision(d.collider);
                        }
                    }
                }
            }
        }

        for (i=0; i<this.top.length; i++){
            t = this.top[i];
            t.render();
        }
    };
}

function makeCircleSprite(){

}

function makeCircleCollider(entity, radius){
    var collider = {};
    collider.lastChecked = -1;
    collider.radius = radius;
    collider.x = 0;
    collider.y = 0;
    return collider;
}