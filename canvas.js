const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.height = 300;
canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));

alert("Fling bot showcase!\n\nWorks that the bot predicts the future from only 2 sources of information, time and distance.\n\nRed path shows the path the bot predicts you will go.");

var distance = (x0,y0,x2,y2) => {
    //d=√((x_2-x_0)²+(y_2-y_0)²)
    return Math.sqrt((x2-x0)**2+(y2-y0)**2);
}

function RB(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}


var mouse = {
    x: 1,
    y: 1
}

addEventListener("mousemove", (e) => {
    mouse.y = (e.y / window.innerHeight) * canvas.height;
    mouse.x = (e.x / window.innerWidth) * canvas.width;
})

var forceMultiplier = 1000; //N

addEventListener("click", (e) => {
    d = distance(mouse.x,mouse.y,canvas.width/2,canvas.height/2);
    player1.f[0] += ((mouse.x-canvas.width/2)/d)*forceMultiplier;
    player1.f[1] += ((mouse.y-canvas.height/2)/d)*forceMultiplier;
})

addEventListener("contextmenu", (e) => {
    e.preventDefault();
    player1.f = [0,0];
})

class player {
	constructor() {
        this.pos = [0,0];
        this.s = [0,0] //distance that will be added to pos array
        this.v = [0,0]; //m/s
        this.a = [0,0]; //m/(s^2)
        this.f = [0,0]; //N
        this.m = 10; //kg
        this.date = 0;
        this.apply = false;
	}
	update(delta) {
        delta /= 1000;
        for(let i = 0; i <= 2; i++) {
            this.a[i] = this.f[i] / this.m; //a = f/m
            this.s[i] = ((this.v[i] + (this.v[i]+this.a[i]*delta) )/2) * delta//s = ((v0+v)/2)*t, t is delta
            this.v[i] = this.v[i] + this.a[i]*delta//v = v0+at
        }
        this.pos[0] += this.s[0];
        this.pos[1] += this.s[1];
        if(distance(this.pos[0],this.pos[1],0,0) > 100000) {
            this.pos = [0,0];
            this.v = [0,0];
            console.log("RESET TO ORIGIN");
        }
	}
    draw() {
        ctx.fillStyle = "red";
        ctx.fillText("m: "+this.m,0,20,canvas.width);
        ctx.fillText("F: ["+Math.round(this.f[0])+","+Math.round(this.f[1])+"]",0,30,canvas.width);
        ctx.fillText("a: ["+Math.round(this.a[0])+","+Math.round(this.a[1])+"]",0,40,canvas.width);
        ctx.fillText("v: ["+Math.round(this.v[0])+","+Math.round(this.v[1])+"]",0,50,canvas.width);
        ctx.fillText("pos: ["+Math.round(this.pos[0])+","+Math.round(this.pos[1])+"]",0,60,canvas.width);
        ctx.fillStyle = "white";
        RelativeDraw(this.pos[0],this.pos[1],this.m,this.m);
        drawline(this.pos[0],this.pos[1],this.f[0] + this.pos[0],this.f[1] + this.pos[1],"grey");
    }
}

var player1 = new player();
RelativeDraw = (x,y,size) => {
    ctx.fillRect(Math.round(canvas.width/2 + (x - player1.pos[0]) - size/2),Math.round(canvas.height/2 + (y - player1.pos[1]) - size/2),size,size);
    //console.log(Math.round(canvas.width/2 + (x - player1.pos[0]) - size/2),Math.round(canvas.height/2 + (y - player1.pos[1]) - size/2),size,size);
}

DrawMap = () => {
    for(let i = 0; i < canvas.width; i++) {
        for(let j = 0; j < canvas.height; j++) {
            if(Math.round(Math.abs(player1.pos[0] + i)) % 150 == 0 || Math.round(Math.abs(player1.pos[1] + j)) % 150 == 0) {
                ctx.fillRect(i,j,1,1);
            }
        }
    }
}

drawline = (x,y,x2,y2,color) => {
    ctx.fillStyle = color;
    let d = distance(x,y,x2,y2);
    let kx = (x2-x)/d;
    let ky = (y2-y)/d;
    for(let i = 0; i < d; i++) {
        RelativeDraw(Math.round(x+i*kx),Math.round(y+i*ky),1,1);
    }
}

var applyforce = true;
colision = (time,flingforce) => {
    if(applyforce == true) {
        applyforce = false;
        player1.f = [RB(flingforce*-1,flingforce), RB(flingforce*-1,flingforce)];
        console.log("COLISION FORCE",player1.f,"PLAYER COORDINATE",player1.pos);
        message = "COLISION!";
        setTimeout(() => {
            player1.f = [0,0];
            applyforce = true;
        },time)
    }
}

class flingbot {
    constructor(pos) {
        this.list = [[],[]]; //x, y
        this.rpos = [[0,0],[0,0]];
        this.pos = pos;
        this.size = -1;
        this.change = 1000;
        this.finaltime = 0;
        this.elapsed = 0;
        this.elapsedR = 0;
        this.radius = 15;
        this.force = 10000;
        this.color = false;
        this.debug = false;
        this.quick = false;
        this.quicktime = 0;
        this.fx = { //max second grade polynomial approximation function
            xsm: 0, //x squared multiplier
            xm: 0, //x multiplier
            m: 0 //rest
        }
        this.fy = { //max second grade polynomial approximation function
            ysm: 0, //y squared multiplier
            ym: 0, //y multiplier
            m: 0 //rest
        }
        this.fset = false;
    }
    update(delta,pos) {
        this.elapsedR += delta
        if(this.elapsedR > (this.change-this.quicktime)/4 || this.size >= 3 || this.quick == true) {
            if(this.size <= -1) {
                this.size++;
                this.rpos[0] = Array.from(pos);
                console.log("ADDING VALUES FOR PREDICTION!");
            } else if(this.size == 0) {
                this.size++;
                this.list[0].push([this.elapsedR,pos[0]-this.rpos[0][0]]);
                this.list[1].push([this.elapsedR,pos[1]-this.rpos[0][1]]);
                console.log("ADDING VALUES FOR PREDICTION!");
            } else if(this.size > 0 && this.size < 3) {
                this.size++;
                this.list[0].push([this.elapsedR+this.list[0][this.list[0].length-1][0],pos[0] - this.rpos[0][0]]);
                this.list[1].push([this.elapsedR+this.list[1][this.list[1].length-1][0],pos[1] - this.rpos[0][1]]);
                console.log("ADDING VALUES FOR PREDICTION!");
            } else if(this.size >= 3 && this.fset == false) { //figure out math function for x and y pos here based on delta time
                this.size = -1;
                let xkvalues = [[],[]];
                let ykvalues = [[],[]];
                let fxk = 0;
                let fyk = 0;
                //figuring out math function for x axis
                xkvalues[0].push(this.list[0][0][0]+(this.list[0][1][0]-this.list[0][0][0])/2);
                xkvalues[0].push(this.list[0][1][0]+(this.list[0][2][0]-this.list[0][1][0])/2);
                xkvalues[1].push((this.list[0][1][1]-this.list[0][0][1])/(this.list[0][1][0]-this.list[0][0][0]));
                xkvalues[1].push((this.list[0][2][1]-this.list[0][1][1])/(this.list[0][2][0]-this.list[0][1][0]));
                fxk = (xkvalues[1][1]-xkvalues[1][0])/(xkvalues[0][1]-xkvalues[0][0]);
                this.fx.xsm = fxk/2;
                this.fx.xm = ((this.list[0][1][1]-this.fx.xsm*this.list[0][1][0]**2)-(this.list[0][0][1]-this.fx.xsm*this.list[0][0][0]**2))/(this.list[0][1][0]-this.list[0][0][0]);
                this.fx.m = this.list[0][0][1]-this.fx.xsm*this.list[0][0][0]**2-this.fx.xm*this.list[0][0][0];
                //figuring out math function for y axis
                ykvalues[0].push(this.list[1][0][0]+(this.list[1][1][0]-this.list[1][0][0])/2);
                ykvalues[0].push(this.list[1][1][0]+(this.list[1][2][0]-this.list[1][1][0])/2);
                ykvalues[1].push((this.list[1][1][1]-this.list[1][0][1])/(this.list[1][1][0]-this.list[1][0][0]));
                ykvalues[1].push((this.list[1][2][1]-this.list[1][1][1])/(this.list[1][2][0]-this.list[1][1][0]));
                fyk = (ykvalues[1][1]-ykvalues[1][0])/(ykvalues[0][1]-ykvalues[0][0]);
                this.fy.ysm = fyk/2;
                this.fy.ym = ((this.list[1][1][1]-this.fy.ysm*this.list[1][1][0]**2)-(this.list[1][0][1]-this.fy.ysm*this.list[1][0][0]**2))/(this.list[1][1][0]-this.list[1][0][0]);
                this.fy.m = this.list[1][0][1]-this.fy.ysm*this.list[1][0][0]**2-this.fy.ym*this.list[1][0][0];
                //reset the list and set that math function is defined
                this.finaltime = this.list[0][2][0];
                this.elapsed = 0 - delta;
                this.rpos[1] = Array.from(pos); //need to copy arrays because otherwise it acts like pointers
                this.list = [[],[]];
                this.fset = true;
                console.log("PREDICTION SET!\nX="+this.fx.xsm+"*T^2+"+this.fx.xm+"*T+"+this.fx.m+"\nY="+this.fy.ysm+"*T^2+"+this.fy.ym+"*T+"+this.fy.m);
                if(this.quick == false) {
                    message = "PREDICTION SET!";
                }
                this.quick = false;
                this.quicktime = 0;
            }
            this.elapsedR = 0;
        }
        if(this.color == true) {
            ctx.fillStyle = "red";
            this.color = false;
        } else {
            ctx.fillStyle = "blue";
            this.color = true;
        }
        RelativeDraw(this.pos[0],this.pos[1],10,10);
        if(this.fset == true) {
            this.elapsed += delta
            let factor = ((this.change-this.quicktime)-this.elapsed/2)
            this.pos[0] = this.xprediction(factor);
            this.pos[1] = this.yprediction(factor);
            if(distance(pos[0],pos[1],this.xprediction(this.elapsed),this.yprediction(this.elapsed)) > 5 || this.quick == true) {
                this.fset = false;
                this.quick = true;
                this.quicktime = 0;
                this.elapsed = 0;
                message = "QUCIK NEW PREDICTION SET!"+(this.change-this.quicktime);
                console.log(message);
            }
            if(this.elapsed >= this.change-this.quicktime || (distance(this.pos[0],this.pos[1],pos[0],pos[1]) <= this.radius && this.debug == false)) {
                this.elapsed = 0;
                this.fset = false;
                if(distance(this.pos[0],this.pos[1],pos[0],pos[1]) <= this.radius && this.debug == false) {
                    colision(500,this.force);
                    this.quick = true;
                    this.size = -1;
                    this.list = [[],[]];
                }
                message = "NEW PREDICTION!"+(this.change-this.quicktime);
                console.log(message);
            }
            let ox = this.xprediction(0);
            let oy = this.yprediction(0)
            ctx.fillStyle = "red";
            for(let i = 1; i < this.change-this.quicktime; i += 10) {
                let x = this.xprediction(i);
                let y = this.yprediction(i);
                drawline(x,y,ox,oy);
                ox = x;
                oy = y;
            }
            RelativeDraw(this.xprediction(this.elapsed),this.yprediction(this.elapsed),12,12);
            ctx.fillStyle = "grey";
            RelativeDraw(this.rpos[1][0],this.rpos[1][1],10,10);
        }
    }

    xprediction(x) {
        return this.rpos[1][0] + this.fx.xsm * x**2 + this.fx.xm * x + this.fx.m;
    }
    yprediction(y) {
        return this.rpos[1][1] + this.fy.ysm * y**2 + this.fy.ym * y + this.fy.m;
    }
}

var bot = new flingbot([RB(-1000,1000),RB(-1000,1000)]);

var message = "";

var start = Date.now();
var gfps = 1000/60;
var fps = gfps;
var game = () => {
    ctx.fillStyle = "grey";
    DrawMap();
    player1.update(1000/fps)
    bot.update(1000/fps,player1.pos);
    player1.draw()
    ctx.fillStyle = "red";
    ctx.fillRect(Math.round(mouse.x),Math.round(mouse.y),1,1);
	setTimeout(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        fps = 1000/(Date.now()-start)
        ctx.fillText("FPS: " + Math.round(fps),0,10,canvas.width);
        ctx.fillText(message,0,70,canvas.width);
        start = Date.now();
		game();
	},gfps);
}
bot.force = 5000;
bot.change = 100;

alert("CLICK TO ADD FORCE VECTOR! (1000 Newton)\n\nRIGHT CLICK TO SET FORCE VECTOR TO 0");
colision(1000,RB(-1000,1000));
game();
