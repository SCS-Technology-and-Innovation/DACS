var canvas = document.getElementById('draw');
var ctx = canvas.getContext('2d'); 
var cw = canvas.width;
let ch = canvas.height;
const gr = (1 + Math.sqrt(5)) / 2; // golden ratio
const tc = '#ffffff'; // text color 
ctx.textAlign = 'center';
canvas.addEventListener('mousedown', pick, false);
canvas.addEventListener('mousemove', drag, false);
canvas.addEventListener('mouseup', drop, false);
const bb = canvas.getBoundingClientRect();

let table = document.getElementById("stats");


// this stuff changes when the elevator count changes
let elevators = [];
let ew = 10; // elevator width
let eh = 10; // elevator height
let fs = 5; // font size
let y = 5; // elevator start height
let meters = 10; // default distance span
let sc = 0; // snapshot counter

ctx.lineWidth = 3;
let carpet = {};
carpet.color = '#999999';
carpet.border = '#666666';

let stand = {};
stand.color = '#ffffff';
stand.border = '#dddddd';
stand.radius = 10; // fixed

// for repositioning
var chosen = {};
chosen.active = false;

// whether a click falls inside an box
function inside(cx, cy, element) {
    let high = element.top;
    if (cy < high) {
	// console.log('Too high', cy, 'vs', y);
	return false;
    }
    let low = element.bottom;
    if (cy > low) {
	// console.log('Too low', cy, 'vs', low);
	return false;
    }
    let start = element.position;
    let end = start + element.width;
    return cx >= start && cx <= end;
}

function reposition(x) {
    if (chosen.active) {
	let diff = chosen.current - x;
	chosen.elevator.position -= diff;
	chosen.current = x;
	return true;
    }
    return false;
}

function pick(event) {
    let cx = event.pageX - bb.left;
    let cy = event.pageY - bb.top;
    if (inside(cx, cy, carpet)) {
	let d = stand.radius;
	stand.x = Math.round(cx);
	stand.y = Math.round(cy + d);
	// console.log('Picked a place to stand');
	visualize(); // redraw
	return true;
    }
    for (const e of elevators) {
	if (inside(cx, cy, e)) {
	    chosen.active = true;
	    chosen.elevator = e;
	    chosen.current = cx;
	    // console.log('Picked up ' + e.label);
	    return true;
	}
    }
    return false;
}

function drag(event) {
    if (reposition(event.pageX - bb.left)) {
	visualize(); // redraw
	return true;
    }
    return false;
}

function drop(event) {
    if (reposition(event.pageX - bb.left)) {
	visualize();
	chosen.active = false;
    }
    return false;
}

const counter = document.getElementById('count');
counter.addEventListener('change', init);

const spacer = document.getElementById('space');
spacer.addEventListener('change', init);

function setup(n) {
    elevators = []; // reset    
    // max half empty space
    var space = (100 - parseInt(spacer.value) / 2) / 100;
    // console.log('Spacing', space);
    var col = palette('tol-rainbow', n);
    ew = Math.floor(space * cw / n);
    eh = gr * ew;
    ch = Math.ceil(1.5 * eh * (1 + space));
    canvas.height = ch;
    let margin = Math.floor(((cw - n * ew) / (n + 1)));
    fs = Math.ceil(ew / 6);
    ctx.font = 'bold ' + fs + 'px Courier';    
    // console.log('Sizes: ', ew, margin, fs);
    var x = margin;
    y = margin;
    let incr = ew + margin;
    carpet.position = margin;
    carpet.width = cw - 2 * margin;
    carpet.top = y + eh + margin;
    carpet.bottom = ch - margin;
    carpet.height = carpet.bottom - carpet.top;
    stand.x = Math.round(cw / 2);
    stand.y = Math.round((carpet.bottom + carpet.top) / 2);
    for (let i = 0; i < n; i++) {
	let c = '#' + col[i];
	let e = {};
	e.color = c;
	e.position = x;
	e.width = ew;
	e.middle = x + ew / 2;
	e.height = eh;
	e.top = y;
	e.bottom = y + eh;	
	e.label = 'E' + (i + 1);
	x += incr;
	elevators.push(e);
    }
}

function data(n) {
    for (let i = 0; i < n; i++) {
	let l = i + 1;
	let row = table.insertRow(l);
	let label = row.insertCell(0);
	let count = row.insertCell(1);
	let dist = row.insertCell(2);
	let total = row.insertCell(3);
	label.innerHTML = "Elevator " + (l);
	count.innerHTML = 0;
	dist.innerHTML = "";
	total.innerHTML = 0;
    }
}

function init() {
    var n = parseInt(counter.value);
    meters = n + 3; // assume the whole thing is this meters wide
    setup(n);
    data(n);
    visualize();    
}

function drawCarpet() {
    ctx.fillStyle = carpet.color;
    ctx.strokeStyle = carpet.border;
    ctx.beginPath();
    let x = carpet.position;
    let y = carpet.top;
    let w = carpet.width;
    let h = carpet.height;
    ctx.rect(x, y, w, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawStandingSpot() {
    // draw the standing spot
    ctx.fillStyle = stand.color;
    ctx.strokeStyle = stand.border;
    ctx.beginPath();
    x = stand.x;
    y = stand.y;
    let r = stand.radius;
    ctx.arc(x, y, r, 0, 2 * Math.PI); // circle
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tc;
    ctx.fillText('Stand here', x + 2 * r, y);
}

function drawElevators() {
    // draw the elevators
    for (const e of elevators) {
	let color = e.color;
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.beginPath();
	let x = e.position;
	let y = e.top;
	let w = e.width;
	let h = e.height;
	ctx.rect(x, y, w, h);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = tc;
	let hw = Math.floor(w / 2);
	let hh = Math.floor(h / 2);
	ctx.fillText(e.label, x + hw, y + hh);
    }
}

function visualize() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // console.log('Drawing');
    drawCarpet();
    drawStandingSpot();
    drawElevators();
}

const sim = document.getElementById('sim');
const res = document.getElementById('reset');
const repl = document.getElementById('replicas');

// pick an elevator uniformly at random
function arrival() {
    let n = elevators.length;
    let r = Math.random();
    return Math.floor(r * n);
}

// euclidean
function distance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx, dy * dy);
}

function simulate() {
    counter.disabled = true;
    spacer.disabled = true;
    repl.disabled = true;
    sim.disabled = true;
    res.disabled = false;
    let total = parseInt(repl.value);
    // starting location
    let xs = stand.x;
    let ys = stand.y;
    for (let r = 0; r < total; r++) {
	let e = arrival();
	// record the statistic
	let record = stats.rows[e + 1];
	let freq = record.cells[1];
	let current = parseInt(freq.innerHTML);
	freq.innerHTML = current + 1;
	if (current == 0) { // first time
	    let d = record.cells[2];	    
	    // target location
	    let xt = elevators[e].middle;
	    let yt = elevators[e].bottom;
	    let dist = meters * distance(xs, ys, xt, yt) / cw;
	    d.innerHTML = dist.toFixed(2);
	}
    }
    let n = elevators.length;
    let sum = 0;
    for (let e = 0; e < n; e++) {
	let record = stats.rows[e + 1];
	let f = parseInt(record.cells[1].innerHTML);
	let d = parseFloat(record.cells[2].innerHTML);
	let t = f * d;
	record.cells[3].innerHTML = t.toFixed(2);
	sum += t;
    }
    let avg = sum / total;
    let today = new Date();
    let now = today.getHours() + ":" +
	today.getMinutes() + ":" +
	today.getSeconds();
    let dest = document.getElementById('average');
    var log = document.createElement('p');    
    log.innerHTML =
	'The average in the simulation done at ' + now +
	' with ' + n + ' elevators was ' + avg.toFixed(2) + ' meters of walking.';
    dest.appendChild(log);     
    var snapshot = document.createElement('canvas');
    var ssc = snapshot.getContext('2d');
    snapshot.id = 'c' + sc++;
    snapshot.width = cw;
    snapshot.height = ch;
    ssc.drawImage(canvas, 0, 0); // clone
    // add timestamp
    ssc.font = fs + 'px Courier';        
    ssc.fillStyle = tc; 
    ssc.fillText('Simulation setup at ' + now, fs + 3, fs + 3);
    dest.appendChild(snapshot);    
}

function reset() {
    counter.disabled = false;
    spacer.disabled = false;
    repl.disabled = false;    
    sim.disabled = false;
    res.disabled = true;
    let n = elevators.length;
    for (let i = 0; i < n; i++) {
	let l = i + 1;
	let row = table.rows[l];
	row.cells[0].innerHTML = "Elevator " + (l);
	row.cells[1].innerHTML = 0;
	row.cells[2].innerHTML = "";
	row.cells[3].innerHTML = 0;
    }
}

init();
