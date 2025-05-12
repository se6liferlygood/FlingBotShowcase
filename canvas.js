const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.height = 400;
canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));

var distance = (x0,y0,x2,y2) => {
    //d=√((x_2-x_0)²+(y_2-y_0)²)
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
        ctx.fillText("F: ["+Math.round(this.f[0])+","+Math.round(this.f[1])+"], " + Math.round(distance(this.f[0],this.f[1],0,0)),0,30,canvas.width);
        ctx.fillText("a: ["+Math.round(this.a[0])+","+Math.round(this.a[1])+"], " + Math.round(distance(this.a[0],this.a[1],0,0)),0,40,canvas.width);
        ctx.fillText("v: ["+Math.round(this.v[0])+","+Math.round(this.v[1])+"], " + Math.round(distance(this.v[0],this.v[1],0,0)),0,50,canvas.width);
        ctx.fillText("pos: ["+Math.round(this.pos[0])+","+Math.round(this.pos[1])+"], " + Math.round(distance(this.pos[0],this.pos[1],0,0)),0,60,canvas.width);
        ctx.fillStyle = "white";
        RelativeDraw(this.pos[0],this.pos[1],this.m*3,this.m*3);
        drawline(this.pos[0],this.pos[1],this.f[0] + this.pos[0],this.f[1] + this.pos[1],"grey");
    }
}

var player1 = new player();
RelativeDraw = (x,y,size) => {
    ctx.fillRect(Math.round(canvas.width/2 + (x - player1.pos[0]) - size/2),Math.round(canvas.height/2 + (y - player1.pos[1]) - size/2),size,size);
}

DrawMap = () => {
    let startj = 0;
    let starti = 0;
    let space = 150;
    let ij = 1;
    let ii = 1;
    for(let i = starti; i < canvas.width; i += ii) {
        if(Math.round(Math.abs(player1.pos[0] + i)) % space == 0 || ii == space) {
            ctx.fillRect(i,1,1,canvas.height);
            console.log(i);
            if(ii == 1) { 
                starti = i;
                ii = space;
            }
        }
        for(let j = startj; j < canvas.height; j += ij) {
            if(Math.round(Math.abs(player1.pos[1] + j)) % space == 0 || ij == space) {
                ctx.fillRect(1,j,canvas.width,1);
                console.log(j);
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
        RelativeDraw(Math.round(x+i*kx),Math.round(y+i*ky),1,1);
    }
}

var places = [[[],[]],[[],[]]] //X: (time, pos), Y: (time, pos)
var size = 0
var ddtime = 0;
var cycle = 0;
var k = [[0,0],
         [0,0],
         [0,0]];


var fpredict = (time,axis) => { //axis: 0 = x, 1 = y
    return k[0][axis] + k[1][axis]*time + k[2][axis]*time**2
}
var predict = (pos,dtime) => {
    ddtime += dtime
    if(places.size < 3) {
        size++;
        places[0][1].push(pos[0]);
        places[1][1].push(pos[1]);
        places[0][0].push(ddtime);
        places[1][0].push(ddtime);
    } else {
        for(let i = 0; i <= 1; i++) {
            places[0][1][i] = places[0][1][i+1];
            places[1][1][i] = places[1][1][i+1];
            places[0][0][i] = places[0][0][i+1];
            places[1][0][i] = places[1][0][i+1];
        }
        places[0][1][2] = pos[0];
        places[1][1][2] = pos[1];
        places[0][0][2] = ddtime;
        places[1][0][2] = ddtime;
        for(let i = 0; i <= 1; i++) {
            k[2][i] = ((places[i][1][0]-places[i][1][1])/(places[i][0][0]-places[i][0][1])-(places[i][1][1]-places[i][1][2])/(places[i][0][1]-places[i][0][2]))/(places[i][0][0]-places[i][0][2]);
            k[1][i] = (places[i][1][0]-places[i][1][1]+k[2][i]*(places[i][0][1]**2-places[i][0][0]**2))/(places[i][0][0]-places[i][0][1]);
            k[0][i] = places[i][1][0]-k[1][i]*places[i][0][0]-k[2][i]*places[i][0][0]**2;
        }
        let ox = fpredict(ddtime,0);
        let oy = fpredict(ddtime,1);
        for(let i = 0; i < 10000; i += 10) {
            let x = fpredict(ddtime+i,0);
            let y = fpredict(ddtime+i,1)
            drawline(ox,oy,x,y,"Red");
            ox = x;
            oy = y;
        }
    }
    if(ddtime >= 1000) {
        for(let i = 0; i <= 2; i++) {
            places[0][0][i] = places[0][0][i] - ddtime;
            places[1][0][i] = places[1][0][i] - ddtime;
        }
        ddtime = 0;
    }
}

var start = Date.now();
var gfps = 1000/60;
var fps = gfps;
var game = () => {
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
	setTimeout(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        fps = 1000/(Date.now()-start)
        ctx.fillText("FPS: " + Math.round(fps),0,10,canvas.width);
        start = Date.now();
		game();
	},gfps);
}

alert("HOLD LEFT MOUSE BUTTON FOR FORCE VECTOR!\n\nRED PATH SHOWS 10 SECOND PREDICTION IF EVERYTHING STAYS THE SAME!");

game();
