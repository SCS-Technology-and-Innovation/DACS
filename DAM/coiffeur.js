var canvas = document.getElementById('draw');
var ctx = canvas.getContext('2d');
ctx.textAlign = 'center';
const tc = '#ffffff'; // text color 
let wt = document.getElementById("workerstats");
let ct = document.getElementById("clientstats");

let workers = [];
let loungechairs = [];

TAKEN = '#990033';
BUSY = '#993333';
FREE = '#336633';
IDLE = '#336666';

const MARGIN = 15;
let RADIUS = 1;
let BOTTOM = 1;
let LSTEP = 1;
let WSTEP = 1;

let RATE = 0.2;
let available = [];

function tickWorkers() {
    for (const c of workers) {
	if (!!c.customer) { // serving a client
	    if (Math.random() < RATE) { // done :)
		c.customer = null;
		c.served += 1;
		available.push(c); // go wait
	    } 
	} else {
	    c.idle += 1; // not working
	}
    }
}

function tickLounge() {
    let served = [];
    for (const c of pending) { // for each pending client (FCFS)
	if (c.waited > maxwait) {
	    lost += 1; // the client will leave
	    let seat = loungechairs.indexOf(c.seat);
	    loungechairs[seat].occupant = null; // release the seat
	    c.seat = null; // no longer seated in the lounge
	} else {
	    let chosen = null;
	    if (!!c.preference) { // has a preference
		let w = workers[c.preference];
		let i = available.indexOf(w);
		if (i > -1) { // the preference is available
		    available.splice(i, 1); // assign to this client
		    chosen = w;
		}
	    } else { // no preference
		if (available.length > 0) { // idle coiffeurs
		    if (ordered) {
			chosen = workers[available.pop(0)]; // FIFO
		    } else {
			let r = [Math.floor(Math.random() * available.length)];
			chosen = workers[r];
		    }
		}
	    }
	    if (!!chosen) {
		wait.push(c.waited); // record waiting time
		loungechairs[seat[c]].occupant = null; // release the seat
		chosen.customer = c;
		if (c.preference == null) {
		    c.preference = chosen; // becomes a regular
		}
		chosen.duration = 0; // start tracking the duration
		served.push(c);
	    } else { // not getting served
		c.waited += 1 
	    }
	}
    }
    for (const c of served) {
	let i = pending.indexOf(c);
	if (i > -1) { 
	    pending.splice(i, 1); // no longer pending
	}
    }
}

function setup() {
    let w = 0.8 * window.innerWidth;
    let n = parseInt(document.getElementById('workers').value);
    workers = []; 
    DIM = Math.floor((w - 2 * MARGIN) / n);
    for (let i = 0; i < n; i++) {
	let w = {};
	w.occupant = null;
	w.idle = 0;
	w.served = 0;
	workers.push(w);
    }
    people = 2 * MARGIN + n * DIM;

    n = parseInt(document.getElementById('lounge').value);
    loungechairs = []; 
    RADIUS = Math.floor((w - 2 * MARGIN) / (2 * n));
    for (let i = 0; i < n; i++) {
	let c = {};
	c.occupant = null;
	loungechairs.push(c);
    }
    chairs = 2 * MARGIN + n * 2 * RADIUS;
    
    fontsize = Math.ceil(2 * Math.sqrt(Math.min(DIM, RADIUS)));
    ctx.font = 'bold ' + fontsize + 'px Courier';
    canvas.height = 3 * MARGIN + 2 * RADIUS + DIM;
    BOTTOM = canvas.height - RADIUS - MARGIN;
    canvas.width = Math.max(people, chairs);
    visualize();
}


function drawLounge() {
    let x = RADIUS + MARGIN;
    for (const c of loungechairs) {
	let color = FREE;
	if (!!c.occupant) {
	    color = TAKEN;
	}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.arc(x, BOTTOM, RADIUS, 0, 2 * Math.PI); // circle
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	if (!!c.occupant) { // show client label	
	    ctx.fillStyle = '#ffffff'
	    ctx.fillText(c.occupant.label, x, BOTTOM);
	}
	x += 2 * RADIUS + MARGIN;
    }
}
    
function drawWorkers() {
    let x = MARGIN;
    for (const c of workers) {
	let color = IDLE;
	if (!!c.customer) {
	    color = BUSY;
	}
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.rect(x, MARGIN, DIM, DIM);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	if (!!c.customer) { // show client label	
	    ctx.fillStyle = '#ffffff'
	    ctx.fillText(c.customer.label, x, BOTTOM);
	}	
	x += DIM + MARGIN;
    }
}

function visualize() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLounge();
    drawWorkers();
}

/* 
   adapted from
   https://stackoverflow.com/questions/45309447/calculating-median-javascript
*/
function median(v){
    if (v.length === 0) {
	return 0;
    }
    v.sort(function(a, b){
	return a - b;
    });
    var h = Math.floor(v.length / 2);
    if (v.length % 2) {
	return v[h];
    }
    return (v[h - 1] + v[h]) / 2.0;
}

/* adapted from
   https://reqbin.com/code/javascript/m81eb1ms/javascript-sum-array-example
*/
function average(v) {
    let sum = v.reduce(function(a, b){
	return a + b;
    });
    return sum / v.length;
}

function updateStats() {
    let ws = wt.getElementsByTagName('tbody')[0];
    for (let i = 0; i< workers.length; i++) {
	let r = ws.rows[i];
	r.cells[2].innerHTML = w.idle;
	r.cells[3].innerHTML = w.served; 
    }
    let cs = ct.getElementsByTagName('tbody')[0];
    let r = cs.rows[0];
    r.cells[2].innerHTML = served;
    r.cells[3].innerHTML = lost;
    r.cells[4].innerHTML = full;
    r.cells[4].innerHTML = average(wait).toFixed(2);
    r.cells[4].innerHTML = median(wait).toFixed(0);
    r.cells[4].innerHTML = Math.max(wait);
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

    
    
function simulate() {
    const clientcount = parseInt(document.getElementById('clients').value);
    const workercount = parseInt(document.getElementById('workers').value);
    const maxwait = parseInt(document.getElementById('churn').value);
    const capacity = parseInt(document.getElementById('lounge').value);
    const total = parseInt(document.getElementById('arrivals').value);
    data(n); // prep the stats tables   
    for (let r = 0; r < total; r++) { // replicas
	if (Math.random() < rate) { // a new arrival
	    let c = Math.floor(r * n); // which client
	    if (pending.indexOf(c) > -1) { // not here yet
		let client = {}; // create the client 
		client.label = c;
		client.waited = 0;
		client.seat = null;
		for (const chair of loungechairs) { // find a seat
		    if (chair.occupant == null) {
			client.seat = chair; // seat them
			chair.occupant = client;
			pending.push(client); // they wait
		    }
		}
		if (client.seat == null) {
		    full += 1; // this client does not fit in the lounge
		}
	    }
	}
	// progress the services
	tickWorkers();
	tickLounge();
	updateStats();
    }
}

document.getElementById('workers').addEventListener('change', setup);
document.getElementById('lounge').addEventListener('change', setup);

window.addEventListener('resize', setup);
setup();

