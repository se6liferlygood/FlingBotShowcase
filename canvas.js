const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.height = 400;
canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));

var vsize = (a) => {
    return Math.sqrt(a[0]**2+a[1]**2);
}

var distance = (x0,y0,x2,y2) => {
    return Math.sqrt((x2-x0)**2+(y2-y0)**2);
}

var mouse = {
    x: 1,
    y: 1
}

var point = [0,0];

addEventListener("mousemove", (e) => {
    mouse.y = (e.y / window.innerHeight) * canvas.height;
    mouse.x = (e.x / window.innerWidth) * canvas.width;
})

var rest = false;
var down = false

addEventListener("mouseup", (e) => {
    if(e.button === 0) {
        rest = true;
        down = false;
        player1.f = [0,0];
    }
})

addEventListener("mousedown", (e) => {
    if(e.button === 0) {
        down = true;
        rest = false;
        point[0] = player1.pos[0] + mouse.x - canvas.width / 2;
        point[1] = player1.pos[1] + mouse.y - canvas.height / 2;
    }
})

addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

var tfactor = 1 //time factor

class player {
	constructor() {
        this.pos = [0,0];
        this.s = [0,0] //distance that will be added to pos array
        this.v = [0,0]; //m/s
        this.a = [0,0]; //m/(s^2)
        this.f = [0,0]; //N
        this.m = 3; //kg
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
	}
    draw() {
        ctx.fillStyle = "red";
        ctx.fillText("m: "+this.m,0,20,canvas.width);
        ctx.fillText("F: ["+Math.round(this.f[0])+","+Math.round(this.f[1])+"], " + Math.round(vsize(this.f)),0,30,canvas.width);
        ctx.fillText("a: ["+Math.round(this.a[0])+","+Math.round(this.a[1])+"], " + Math.round(vsize(this.a)),0,40,canvas.width);
        ctx.fillText("v: ["+Math.round(this.v[0])+","+Math.round(this.v[1])+"], " + Math.round(vsize(this.v)),0,50,canvas.width);
        ctx.fillText("pos: ["+Math.round(this.pos[0])+","+Math.round(this.pos[1])+"], " + Math.round(vsize(this.pos)),0,60,canvas.width);
        ctx.fillStyle = "white";
        RelativeDraw(this.pos[0],this.pos[1],this.m*3,this.m*3);
        drawline(this.pos[0],this.pos[1],this.f[0] + this.pos[0],this.f[1] + this.pos[1],"grey");
    }
}

var player1 = new player();
var RelativeDraw = (x,y,size) => {
    let xx = Math.round(canvas.width/2 + (x - player1.pos[0]) - size/2);
    let yy = Math.round(canvas.height/2 + (y - player1.pos[1]) - size/2)
    ctx.fillRect(xx,yy,size,size);
    if(xx > canvas.width || xx < 0 || yy > canvas.height || yy < 0) {
        return false
    } else {
        return true
    }
}

var DrawMap = () => {
    let startj = 0;
    let starti = 0;
    let space = 150;
    let ij = 1;
    let ii = 1;
    for(let i = starti; i < canvas.width; i += ii) {
        if(Math.round(Math.abs(player1.pos[0] + i)) % space == 0 || ii == space) {
            ctx.fillRect(i,1,1,canvas.height);
            if(ii == 1) { 
                starti = i;
                ii = space;
            }
        }
        for(let j = startj; j < canvas.height; j += ij) {
            if(Math.round(Math.abs(player1.pos[1] + j)) % space == 0 || ij == space) {
                ctx.fillRect(1,j,canvas.width,1);
                if(ij == 1) {
                    startj = j;
                    ij = space;
                }
            }
        }
    }
}

var drawline = (x,y,x2,y2,color) => {
    ctx.fillStyle = color;
    let d = distance(x,y,x2,y2);
    let kx = (x2-x)/d;
    let ky = (y2-y)/d;
    for(let i = 0; i < d; i++) {
        let xx = Math.round(x+i*kx);
        let yy = Math.round(y+i*ky);
        if(!RelativeDraw(xx,yy,1,1)) return 0;
    }
}

var places = [[[],[]],[[],[]]] //X: (time, pos), Y: (time, pos)
var size = 0
var ddtime = 0;
var cycle = 0;
var k = [[0,0],
         [0,0],
         [0,0]];


var predictm = 5000;
var predictc = predictm;

var lagrange = (points,x) => { //lagrange interpolation
    let y = 0;
    let n = points[0].length;
    for(let i = 0; i < n; i++) {
        let v = 1;
        for(let j = 0; j < n; j++) {
            if(i == j) continue;
            v *= (x-points[0][j])/(points[0][i]-points[0][j]);
        }
        y += points[1][i] * v;
    }
    return y;
}

var fpredict = (time,axis) => { //axis: 0 = x, 1 = y
    time += ddtime
    return k[0][axis] + k[1][axis]*time + k[2][axis]*time**2
}
var pgrade = 3;
var pps = 30 //prediction per second for stability and performance
var dpt = 0;
var predict = (pos,dtime) => {
    dpt += dtime;
    ddtime += dtime
    if(size < pgrade) {
        size++;
        places[0][1].push(pos[0]);
        places[1][1].push(pos[1]);
        places[0][0].push(ddtime);
        places[1][0].push(ddtime);
    } else {
        if(dpt >= 1000/pps) {
            for(let i = 0; i <= pgrade-2; i++) {
                places[0][1][i] = places[0][1][i+1];
                places[1][1][i] = places[1][1][i+1];
                places[0][0][i] = places[0][0][i+1];
                places[1][0][i] = places[1][0][i+1];
            }
            places[0][1][pgrade-1] = pos[0];
            places[1][1][pgrade-1] = pos[1];
            places[0][0][pgrade-1] = ddtime;
            places[1][0][pgrade-1] = ddtime;
            dpt = 0;
        }
        let ox = lagrange(places[0],ddtime);
        let oy = lagrange(places[1],ddtime);
        for(let i = 0; i < predictm; i += 10) {
            let x = lagrange(places[0],i+ddtime);
            let y = lagrange(places[1],i+ddtime);
            drawline(ox,oy,x,y,"Red");
            ox = x;
            oy = y;
        }
    }
    if(ddtime >= 10000) {
        for(let i = 0; i <= pgrade-1; i++) {
            places[0][0][i] = places[0][0][i] - ddtime;
            places[1][0][i] = places[1][0][i] - ddtime;
        }
        ddtime = 0;
    }
}

var keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

var checkKeys = () => {
    if(keys["ArrowUp"]) {
        pgrade++;
        size = 0;
        places = [[[],[]],[[],[]]]
    } else if(keys["ArrowDown"]) {
        if(pgrade > 2) {
            pgrade--;
            size = 0;
            places = [[[],[]],[[],[]]]
        }
	} else if(keys["ArrowRight"]) {
        pps++;
    } else if(keys["ArrowLeft"]) {
        if(pps > 1) pps--;
    }
}

var start = performance.now();
var fps = 1000/60;
var game = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "grey";
    DrawMap();
    if(rest == false) {
        player1.f = [(point[0]-player1.pos[0]),(point[1]-player1.pos[1])];
    }
    player1.update((1000/fps)*tfactor)
    predict(player1.pos,(1000/fps)*tfactor);
    player1.draw()
    if(down == true) {
        point[0] = player1.pos[0] + mouse.x - canvas.width / 2;
        point[1] = player1.pos[1] + mouse.y - canvas.height / 2;
    }
    ctx.fillStyle = "Red";
    fps = 1000/(performance.now()-start)
    ctx.fillText("FPS: " + Math.round(fps),0,10,canvas.width);
    ctx.fillText("prediction per second: " + pps,0,70,canvas.width);
    ctx.fillText("prediction degree: " + (pgrade-1),0,80,canvas.width);
    start = performance.now();
	requestAnimationFrame(game);
}

alert("hold left mouse button for force vector\n\nuse up or down arrow to customize the prediction degree\n\nuse left or right arrow to customize prediction per second\n\nred path shows the predicted path you will go according to that prediction degree");

setInterval(checkKeys,100);
requestAnimationFrame(game);
