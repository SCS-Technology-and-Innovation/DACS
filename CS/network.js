const gr = (1 + Math.sqrt(5)) / 2; // golden ratio
var canvas = document.getElementById('draw');
var ctx = canvas.getContext('2d');
let bb = canvas.getBoundingClientRect();
let nodes = [];

ctx.lineWidth = 2;
const margin = 6;

// euclidean
function distance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;
    return Math.sqrt(dx * dx, dy * dy);
}

// whether a click falls inside a node
function inside(cx, cy, node) {
    let d = distance(cx, cy, node.xpixel, node.ypixel);
    return d < node.radius;
}

function pick(event) {
    let cx = event.pageX - bb.left;
    let cy = event.pageY - bb.top;
    console.log('Click', cx, cy);
    for (const node of nodes) {
	if (inside(cx, cy, node)) {
	    console.log('Picked', node.label);
	    return true;
	}
    }
    return false;
}

const counter = document.getElementById('count');

function create() {
    var n = parseInt(counter.value);
    let spacing = 1 / n;
    nodes = []; 
    let attempts = 2 * n * n;
    while (nodes.length < n) {
	let node = {};
	node.x = Math.random();
	node.y = Math.random();
	let ok = true;
	for (let other of nodes) {
	    let d = distance(other.x, other.y, node.x, node.y);
	    if (d < spacing) {
		ok = false;
		break;
	    }
	}
	if (ok) {
	    node.neighbors = [];
	    node.label = nodes.length;
	    nodes.push(node);
	}
	attempts--;
	if (attempts == 0) {
	    console.log('Could only accomodate', nodes.length, 'nodes.');
	    break;
	}
    }
    document.getElementById('connection').disabled = false;
    visualize();
}

function slope(origin, destination) {
    let dx = origin.x - destination.x;
    let dy = origin.y - destination.y;
    if (dx > 0) {
	return dy / dx;
    }
    return Infinity;
}

const threshold = 0.2;
function sameSlope(origin, opt1, opt2) {
    let s1 = slope(origin, opt1);
    let s2 = slope(origin, opt2);
    return Math.abs(s1 - s2) < threshold;
}

function distProb(node1, node2) {
    let d = distance(node1.x, node1.y, node2.x, node2.y);
    return d / Math.sqrt(2); // unit square maximum
}

// thinking of this as 1 wanting to connect to 2
function prefProb(node1, node2) {
    let n = nodes.length;
    let d1 = node1.neighbors.length;
    let d2 = node2.neighbors.length;
    let computed = (d2 - d1) / n; // bigger chance if more degree difference
    let chance = Math.max((n - (d1 + d2)) / n, 0);
    let use = Math.max(computed, chance) / 10; 
    return use;
}

function goodToConnect(n1, n2) {
    if (n1 == n2) {
	return false; // reflexive
    }
    if (n1.neighbors.indexOf(n2) == -1) { // not yet connected
	for (let other of n1.neighbors) {
	    if (sameSlope(n1, other, n2)) {
		return false; // too close to another edge
	    }
	}
	for (let other of n2.neighbors) {
	    if (sameSlope(n2, other, n1)) {
		return false; 
	    }
	}
	return true; // will work
    }
    return false; // already connected, not going to connect again
}

let cm = document.getElementById('conn');
let dens = document.getElementById('density');
function link(n1, n2) {
    let density = dens.value / 100;
    let invd = 1 - density;
    var method = cm.options[cm.selectedIndex].value;
    if (goodToConnect(n1, n2)) {
	let keep = true;
	if (method == 'pref') {
	    if (invd * Math.random() > prefProb(n1, n2)) {
		keep = false;
	    }		    
	} else if (method == 'rand') {
	    if (density * Math.random() < distProb(n1, n2)) {
		keep = false;
	    }
	} else { // max
	    if (Math.random() < invd) {
		keep = false;
	    }
	}	
	if (keep) {
	    n1.neighbors.push(n2);
	    n2.neighbors.push(n1);
	    return true;
	}
    }
    return false;
}


function reset() {
    for (let n of nodes) { 
	n.neighbors = [];
    }
    visualize();
    
}

function connect() {
    let n = nodes.length;
    let attempts = 2 * n * n;
    while (true) {
	let r1 = Math.floor(Math.random() * n);
	let r2 = Math.floor(Math.random() * n);
	let n1 = nodes[r1];
	let n2 = nodes[r2];
	if (link(n1, n2)) {
	    visualize();
	    document.getElementById('wipe').disabled = false;    
	    return;
	}
	attempts--;
	if (attempts == 0) {
	    console.log('Unable to add an edge');
	    return;
	}
    }
}

function drawEdges() {
    for (let node of nodes) {
	let x1 = node.xpixel;
	let y1 = node.ypixel;
	for (let neighbor of node.neighbors) {
	    let x2 = neighbor.xpixel;
	    let y2 = neighbor.ypixel;
	    let d = distance(node.x, node.y, neighbor.x, neighbor.y);
	    let dn = Math.floor(d / Math.sqrt(2) * 256);
	    let tone = dn.toString(16).padStart(2, '0');
	    ctx.fillStyle = '#00' + tone + '00';
	    ctx.strokeStyle = '#ff' + tone + 'ff';
	    ctx.beginPath();
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	    ctx.stroke(); 
	}
    }
}

function position() {
    let w = canvas.width;
    let h = canvas.height;
    let r = Math.max(Math.floor(Math.sqrt((w + h) / nodes.length)), 3);
    for (let node of nodes) {
	let x = margin + node.x * (w - 3 * margin);
	let y = margin + node.y * (h - 3 * margin);	
	node.radius = r;
	node.xpixel = x + r;
	node.ypixel = y + r;
    }
}

function drawNodes() {
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#ffff66';
    for (let node of nodes) {
	ctx.beginPath();
	ctx.arc(node.xpixel, node.ypixel, node.radius, 0, 2 * Math.PI); // circle
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
    }
}

function visualize() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    position();
    drawEdges();
    drawNodes();
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
    visualize();
}

counter.addEventListener('change', create);
canvas.addEventListener('mousedown', pick, false);
window.addEventListener('resize', resize);

resize();

