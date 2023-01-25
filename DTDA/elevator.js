let clicking = true;
const gr = (1 + Math.sqrt(5)) / 2; // golden ratio

var canvas = document.getElementById('draw');
var ctx = canvas.getContext('2d');
ctx.textAlign = 'center';
const tc = '#ffffff'; // text color 
let bb = canvas.getBoundingClientRect();

let table = document.getElementById("stats");

// this stuff changes when the elevator count changes
let elevators = [];
let ew = 10; // elevator width
let eh = 10; // elevator height
let fs = 5; // font size
let y = 5; // elevator start height
let meters = 10; // default distance span
let sc = 1; // snapshot counter

ctx.lineWidth = 3;
let carpet = {};
carpet.color = '#999999';
carpet.border = '#666666';

let stand = {};
stand.color = '#ffffff';
stand.border = '#dddddd';
stand.radius = 6; // fixed
const margin = 6;

// for repositioning
var chosen = {};
chosen.active = false;

// whether a click falls inside an box
function inside(cx, cy, element) {
    let high = element.top;
    if (cy < high) {
	console.log('Too high', cy, 'vs', y);
	return false;
    }
    let low = element.bottom;
    if (cy > low) {
	console.log('Too low', cy, 'vs', low);
	return false;
    }
    console.log('Inside');
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
    if (!clicking) {
	return false;
    }
    let cx = event.pageX - bb.left;
    let cy = event.pageY - bb.top;
    console.log('Click', cx, cy);
    console.log('Carpet?');
    if (inside(cx, cy, carpet)) {
	let d = stand.radius;
	stand.x = Math.round(cx);
	stand.y = Math.round(cy);
	console.log('Picked a place to stand');
	visualize(); // redraw
	return true;
    }
    console.log('Elevator?');    
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
    if (!clicking) {
	return false;
    }
    if (reposition(event.pageX - bb.left)) {
	visualize(); // redraw
	return true;
    }
    return false;
}

function drop(event) {
    if (!clicking) {
	return false;
    }
    if (reposition(event.pageX - bb.left)) {
	// update center (for distance calculations)
	chosen.elevator.middle =
	    chosen.elevator.position + chosen.elevator.width / 2;	
	visualize();
	chosen.active = false;
    }
    return false;
}

const counter = document.getElementById('count');

function roll() { // roll out the carpet
    carpet.position = margin;
    carpet.width = canvas.width - 2 * margin;
    carpet.bottom = canvas.height - margin;
    carpet.top = y + eh + margin;
    carpet.height = carpet.bottom - carpet.top;
    stand.x = Math.round(canvas.width / 2);
    stand.y = Math.round((carpet.bottom + carpet.top) / 2);
}

function setup() {
    var n = parseInt(counter.value);
    // console.log('Setting up', n, 'elevators');
    meters = n * gr; // assume the whole thing is this meters wide    
    elevators = []; // reset    
    var col = palette('tol-rainbow', n);
    ew = Math.floor((canvas.width - (n + 1) * margin) / (2 * n));
    eh = Math.floor(3 * (canvas.height - 3 * margin) / 4);
    fs = Math.ceil(2 * Math.sqrt(ew));
    ctx.font = 'bold ' + fs + 'px Courier';    
    // console.log('Sizes: ', ew, margin, fs);
    var x = margin;
    y = margin;
    let incr = ew + Math.floor((canvas.width - 2 * margin - n * ew) / (n - 1));
    roll();
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
    visualize();
}

function data(n) {
    let stat = table.getElementsByTagName('tbody');    
    let tb = stat[0];
    // populate with the required number of rows
    for (let i = 0; i < n; i++) {
	let l = i + 1;
	let row = tb.insertRow(i);
	let slabel = row.insertCell(0);	
	let elabel = row.insertCell(1);	
	let count = row.insertCell(2);
	let dist = row.insertCell(3);
	let total = row.insertCell(4);
	slabel.innerHTML = 'Simulation ' + sc;
	elabel.innerHTML = 'Elevator ' + l;
	count.innerHTML = 0;
	dist.innerHTML = "";
	total.innerHTML = 0;
    }
    let row = tb.insertRow(n);
    let sep = row.insertCell(0);
    let sl = 'sep' + sc;
    sep.id = sl;
    document.getElementById(sl).colSpan = "5";
    sc++; // new stats
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
    ctx.fillText('Stand here', x + 2 * r, y + r);
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
    drawCarpet();
    drawStandingSpot();
    drawElevators();
}

const sim = document.getElementById('sim');
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
    return Math.sqrt(dx * dx + dy * dy);
}

function disable() {
    counter.disabled = true;
    repl.disabled = true;
    sim.disabled = true;
    clicking = false;
}

function enable() {
    counter.disabled = false;
    repl.disabled = false;    
    sim.disabled = false;
    clicking = true;
}

function simulate() {
    disable()
    let total = parseInt(repl.value);
    // starting location
    let xs = stand.x;
    let ys = stand.y;
    let n = elevators.length;
    data(n); // prep the stats table   
    let stat = table.getElementsByTagName('tbody')[0];
    // compute distances
    for (let e = 0; e < n; e++) {
	let record = stat.rows[e];
	let xt = elevators[e].middle;
	let yt = elevators[e].bottom;
	let dist = meters * distance(xs, ys, xt, yt) / canvas.width;
	record.cells[3].innerHTML = dist.toFixed(1);
    }
    for (let r = 0; r < total; r++) {
	let e = arrival();
	// record the statistic
	let record = stat.rows[e];
	let freq = record.cells[2];
	let current = parseInt(freq.innerHTML);
	freq.innerHTML = current + 1;
    }
    let sum = 0;
    for (let e = 0; e < n; e++) {
	let record = stat.rows[e];
	let f = parseInt(record.cells[2].innerHTML);
	let d = parseFloat(record.cells[3].innerHTML);
	let t = f * d;
	record.cells[4].innerHTML = t.toFixed(1);
	sum += t;
    }
    let avg = sum / total;
    let today = new Date();
    let now = today.getHours() + ":" +
	today.getMinutes() + ":" +
	today.getSeconds();
    let dest = document.getElementById('average');
    var snapshot = document.createElement('canvas');
    var ssc = snapshot.getContext('2d');
    snapshot.id = 'c' + sc;
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    ssc.drawImage(canvas, 0, 0); // clone
    // add timestamp
    ssc.font = fs + 'px Courier';        
    ssc.fillStyle = '#000000'; 
    ssc.fillText('Simulation setup at ' + now,
		 2 * margin, canvas.height - 2 * margin);
    dest.prepend(snapshot);
    var log = document.createElement('p');    
    log.innerHTML =
	'The average displacement in the ' + total +
	' replica-simulation with the below setup with ' +
	n + ' elevators was ' + avg.toFixed(1) + ' meters.';
    dest.prepend(log);
    enable()
    
}

function resize() {
    var ww = window.innerWidth / gr;
    var wh = window.innerHeight / gr;
    var wcw = Math.ceil(ww);
    let wch = Math.ceil(wcw / gr);
    let hch = Math.ceil(wh);
    var hcw = Math.ceil(gr * hch);
    if (wcw < hcw) {
	canvas.width = wcw;
	canvas.height = wch;
    } else {
	canvas.width = wcw;
	canvas.height = wch;
    }
    bb = canvas.getBoundingClientRect();    
    setup();
}

counter.addEventListener('change', setup);
canvas.addEventListener('mousedown', pick, false);
canvas.addEventListener('mousemove', drag, false);
canvas.addEventListener('mouseup', drop, false);
window.addEventListener('resize', resize);

resize();

