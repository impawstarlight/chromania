// TODO: allow invalid input ranges

let live = false, geek = false;
const clipf = Cc.chromaClip;
let curInp;

const
	gid = str => document.getElementById(str) 
	gcl = str => document.getElementsByClassName(str);

let outpanel, name, result, box, hex, settings, inpanel, inp, sld;
let val = []; // array holding all color space values for the current color

let _ = [
	[0, 255],
	[0, 360],
	[0, 100]
];

let data = { // bounds for colorspace components
	rgb: {r: _[0], g: _[0], b: _[0]},
	hsv: {h: _[1], s: _[2], v: _[2]},
	hsl: {h: _[1], s: _[2], l: _[2]},
	xyz: {x: [0, 95], y: _[2], z:[0, 109]},
	lab:   {l: _[2], a: [-87, 99],  b: [-108, 85]},
	luv:   {l: _[2], u: [-84, 175], v: [-134, 108]},
	lchab: {l: _[2], c: [0, 134],   h: _[1]},
	lchuv: {l: _[2], c: [0, 179],   h: _[1]},      // 29/10/2021
	oklab: {l: _[2], a: [-24, 28],  b: [-32, 20]}, // 06/04/2022
	oklch: {l: _[2], c: [0, 33],    h: _[1]}
};

// initialize everything
window.onload = () => {
	createInputPanel();
	
	outpanel = gid("output-panel");
	name = gid("color-name");
	result = gid("search-result");
	settings = gid("settings");
	
	box = gcl("box");
	hex = gcl("hex");
	inp = gcl("numinp");
	sld = gcl("slider");
	
	// copy hex
	for (let x of gcl("copy-icon"))
		x.addEventListener("click", copyHex);
	
	// toggle colorspace visibility
	for (let x of gcl("colorspace-name"))
		x.addEventListener("click", function() {
			this.parentElement.classList.toggle("collapse");
			update();
		});
	
	// settings event
	gid("settings-icon").addEventListener("click", function() { gid("settings").classList.toggle("collapse"); this.classList.toggle("active"); });
	for (let x of gcl("settings-checkbox"))
		x.addEventListener("change", settingsChange);
	
	// more events
	box[0].addEventListener("click", nearbyColors);
	hex[0].addEventListener("input", hexInput);
	hex[1].addEventListener("click", hexClick);
	
	let btn = gcl("capbtn");
	for (let i = 0; i < inp.length; i++) {
		inp[i].addEventListener("input", numInput);
		btn[i].addEventListener("click", btnInput);
		sld[i].addEventListener("input", sliderInput);
	}
	
	// name search
	name.autoWidth = function() { this.style.width = "calc("+this.value.length+"ch + 64px)"; }
	name.addEventListener("input", nameSearch);
	gid("search-cont").addEventListener("click", searchClick);
	window.addEventListener("click", globalClick);
	result.addEventListener("transitionend", clearResult);
	
	setPreferences();
	
	if (getComputedStyle(gid("ddetect")).backgroundColor !== "rgb(255, 255, 255)")
		alert("The colors might be displayed incorrectly!\nDisable dark theme extension or similar stuff");
}


function setPreferences() {
	let SVD = localStorage.getItem("impawstarlight-chromania-saved-data");
	let spaces, settings;
	
	if (SVD) {
		// load preferences
		SVD = JSON.parse(SVD);
		setColor(SVD.inpcol);
		//{spaces, settings} = SVD;
		spaces = SVD.spaces;
		settings = SVD.settings;
	} else {
		// random color
		setColor();
		// initial preferences
		spaces = [8,9];
		settings = [0,1,2];
	}
	
	// apply preferences
	let l = Math.max(spaces.length, settings.length);
	let j = 1;
	let cn = gcl("colorspace-name");
	let sc = gcl("settings-checkbox");
	
	spaces.reverse();
	for (let i = 0; i < l; i++) {
		if (spaces[i] !== undefined)
			setTimeout(() => cn[spaces[i]].click(), 500*j++);
		if (settings[i] !== undefined)
			setTimeout(() => sc[settings[i]].click(), 500*j++);
	}
}


window.addEventListener("visibilitychange", () => {
	// save preferences
	if (document.visibilityState === "hidden") {
		let SVD = {
			spaces: [],
			settings: [],
			palette: [],
			inpcol: hex[0].value
		};
		
		let cs = gcl("colorspace");
		for (let i = 0; i < cs.length; i++)
			if (!cs[i].classList.contains("collapse"))
				SVD.spaces.push(i);
		
		let sc = gcl("settings-checkbox");
		for (let i = 0; i < sc.length; i++)
			if (sc[i].checked)
				SVD.settings.push(i);
		
		SVD = JSON.stringify(SVD);
		localStorage.setItem("impawstarlight-chromania-saved-data",  SVD);
		lg(SVD);
	}
	
});


function createInputPanel() {
	inpanel = gid("input-panel");
	let iHTML = "";
	
	let i = 0;
	for (let d in data) {
		iHTML += `
			<div class="colorspace ${d} collapse">
				<div class="colorspace-name">${d}</div>
`;
		for (let c in data[d]) { // c = component
			let b = data[d][c];  // b = bounds
			let step = (c.match(/[abc]/) && d.match(/^ok/)) ? 0.2 : 1;
			iHTML += `
				<div class="container n${i++}">
					<div class="cap-wrapper">
						<div class="capsule capinp">
							<div class="cap-left">${c}</div>
							<input class="cap-right numinp" type="number" min="${b[0]}" max="${b[1]}" step="${d == "rgb" ? 1 : 0.01}">
						</div>
						<div class="capsule capbtn" data-step="${step}">
							<div class="cap-left">-</div>
							<div class="cap-right">+</div>
						</div>
					</div>
					<input class="slider ${d} ${c}" type="range" min="${b[0]}" max="${b[1]}" step="${step}">
				</div>
`;
		}
		iHTML += `
			</div>
`;
	}
	
	inpanel.innerHTML = iHTML;
}


function setColor(color) {
	if (!color)
		 color = "#"+Math.random().toString(16).slice(-6);
	
	val.splice(0, 3, ...Cc.hex2rgb(color));
	update("hex");
}


function update(str) {
	if (typeof str !== "string")
		str = curInp;
	else
		curInp = str;
	
	console.time("val");
	
	let method = str+"2rgb";
	let index  = 0;
	
	if (str === "rgb" || str === "hex")
		method = "nrgb";
	else if (str === "hsv" || str === "hsl")
		method = "d"+method;
	
	if (!Cc[method]) {
		alert("wTf is "+str+"!?\n"+e);
		return;
	}
	
	if (method !== "nrgb")
		index = +(document.querySelector(".colorspace."+str)
		                  .children[1].classList[1].slice(1));
	
	let rgb = Cc[method](val.slice(index, index+3));
	let xyz = Cc.rgb2xyz(rgb);
	let lab = Cc.xyz2lab(xyz);
	let luv = Cc.xyz2luv(xyz);
	let oklab = Cc.xyz2oklab(xyz);
	let oklch = Cc.oklab2oklch(oklab);
	
	val = [
		...Cc.roundx(Cc.drgb(rgb), 0),
		...Cc.rgb2dhsv(rgb),
		...Cc.rgb2dhsl(rgb),
		...xyz,
		...lab,
		...luv,
		...Cc.lab2lch(lab),
		...Cc.luv2lch(luv),
		...oklab,
		...oklch
	];
	
	// round to 1 digit after decimal point
	for (let i = 3; i < val.length; i++)
		val[i] = Math.round(val[i]*10)/10;
	
	//console.timeLog("val");
	
	// rearranging update sequence - 04/04/2022
	// again - 10/04/2022
	updateInps();
	updateColors();
	if (live)
		updateSliderGrad();
	
	console.timeEnd("val");
}

function updateColors() {
	//console.time("colors");
	
	let rgb = val.slice(0, 3),
		oklch = val.slice(27, 30),
		color;
	
	if (Math.max(...rgb, 255) - Math.min(...rgb, 0) > 255) {
		rgb = Cc.drgb(clipf(oklch));
		rgb.push(true);
	}
	
	color = Cc.rgb2hex(rgb);
	//console.time("name");
	let match = Cc.name(color);
	//console.timeEnd("name");
	
	name.value = match[0];
	name.autoWidth();
	
	// setting individually for perfomance since
	// changing color in body or a heavy container
	// element creates lag because of cascading
	
	outpanel.style.setProperty("--given", color);
	outpanel.style.setProperty("--match", match[1]);
	settings.style.setProperty("--match", match[1]);
	
	let uh = document.querySelectorAll(".colorspace:not(.collapse)");
	for (let br of uh)
 		br.style.setProperty("--given", color);
	
	// set hex, asterisk for out of gamut
	hex[0].value = color + (rgb[3] ? "*" : "");
	hex[1].innerHTML = match[1];
	
	// delta e
	box[1].innerHTML = Math.round(match[2]*100)/100;
	
	// hightlight exact match
	if (color === match[1])
		hex[1].parentElement.style.opacity = "0.5";
	else
		hex[1].parentElement.style.opacity = "";
	
	//console.timeEnd("colors");
}

function updateInps() {
	//console.time("inps");
	for (let i = 0; i < val.length; i++)
		if (sld[i].parentElement.parentElement.classList.contains("collapse"))
			i += 2; // skip collapsed colorspaces
		else if (curInp === sld[i].classList[1])
			val[i] = +inp[i].value; // don't change the current colorspace values, to avoid floating point fluctuation
		else // normal
			inp[i].value = sld[i].value = val[i];
	//console.timeEnd("inps");
}


// 04/04/2022
function updateSliderGrad() {
	//console.time("live");
	livegradrgb();
	//console.timeLog("live");
	livegradcie();
	//console.timeEnd("live");
}

// 26/03/2022
function livegradcie() {
	const {max, min} = Math;
	const L = []; // cache for lch l
	const Lcl = {lchab: "lab", lchuv: "luv", oklch: "oklab"};
	
	for (let i = 9; i < sld.length; i++) {
		if (sld[i].parentElement.parentElement.classList.contains("collapse")) {
			i += 2;
			continue;
		}
		let cl = sld[i].classList;
		let b = data[cl[1]][cl[2]]; // boundary values
		let D = (b[1]-b[0])/100.001; // step, and .001 to avoid avoiding the last value bcz of floating point shit
		let method = cl[1]+"2oklch";
		
		let imdex = i%3; // noimce, position of current slider in the group
		let index = i-imdex; // ... first slider in the group
		let arr = val.slice(index, index+3);
		
		let A = geek ? [[],[],[]] : [[]];
		let GR = [];
		
		let lcl =  Lcl[cl[1]];
		// use lab/luv/oklab l gradient in lch modes if available
		if (cl[2] === "l" && !imdex && L[lcl])
			GR = L[lcl];
		else {
			// generate gradient
			for (let x = b[0]; x < b[1]; x += D) {
				arr[imdex] = x;
				let rgb = clipf(Cc[method](arr));
				let a = rgb.pop();
				rgb = Cc.drgb(rgb);
				
				if (geek && a < 1) {
					A[0].push(Cc.rgb2hex(rgb));
					//A[1].push(Cc.rgb2hex(rgb3));
					//A[2].push(Cc.rgb2hex(rgb2));
					A[1].push("transparent");
					A[2].push(`rgba(${[...rgb, a]})`);
				} else {
					rgb = Cc.rgb2hex(rgb);
					for (let p of A)
						p.push(rgb);
				}
			}
			
			for (let gr of A)
				GR.push(`linear-gradient(to right, ${gr})`);
			
			if (!geek) // initial transition fix - 04/04/2022
				GR.push("none", "none");
			
			if (cl[2] === "l" && !imdex)
				L[cl[1]] = GR;
		}
		sld[i].style.backgroundImage = GR;
	}
}

// 27/03/2022
function livegradrgb() {
	// rgb
	for (let i = 0; i < 3; i++) {
		let imdex = i%3; // noimce
		let index = i-imdex;
		let arr = val.slice(index, index+3);
		let GR = [];
		
		arr[imdex] = 0;
		;;GR.push(Cc.rgb2hex(Cc.crgb(arr)));
		arr[imdex] = 255;
		GR.push(Cc.rgb2hex(Cc.crgb(arr)));
		sld[i].style.backgroundImage = `none, linear-gradient(to right, ${GR.join()})`;
		
	}
	
	// sv, sl
	for (let i = 4; i < 9; i++) {
		if (i === 6) continue;
		let method = "d" + sld[i].classList[1] + "2rgb";
		let imdex = i%3; // noimce (2)
		let index = i-imdex;
		let arr = val.slice(index, index+3);
		let GR = [];
		
		arr[imdex] = 0;
		;;GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		if (i === 8) {
			arr[imdex] = 50;
			GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		}
		arr[imdex] = 100;
		GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		sld[i].style.backgroundImage = `none, linear-gradient(to right, ${GR})`;
	}
	
	// h
	let H = [];
	let arr = val.slice(3, 6);
	for (let i = 0; i <= 6; i++) {
		arr[0] = 60*i;
		H.push(Cc.nrgb2safehex(Cc.dhsv2rgb(arr)));
	}
	
	H = `none, linear-gradient(to right, ${H})`;
	sld[3].style.backgroundImage = H;
	sld[6].style.backgroundImage = H;
	
}


function hexInput() {
	let col = this.value;
	
	if (!col.length) {
		this.value = "#";
		return;
	} else { // 31/03/2022
		if (col[0] === "#")
			col = col.slice(1);
		
		if (col.match(/[^\da-f]/i))
			col = this.value = "#"+col.replace(/[^\da-f]/ig, "");
		else
			col = "#"+col;
		
		if (col.length > 7)
			col = this.value = col.slice(0, 7);
	}
	
	if (col.length === 7)
		setColor(col);
}


function hexClick() {
	setColor(hex[1].innerHTML);
}


function numInput() {
	if (!this.reportValidity() || !this.value)
		return;
	
	let i = +this.parentElement.parentElement.parentElement.classList[1].slice(1);
	sld[i].value = val[i] = +this.value;
	
	update(sld[i].classList[1]);
}


function btnInput(e) {
	let i = +this.parentElement.parentElement.classList[1].slice(1);
	let x = e.target.className == "cap-right" ? 1 : -1;
	x *= +this.dataset.step;
	val[i] += x;
	inp[i].value = sld[i].value = val[i] = Math.round(val[i]*10)/10;
	
	if (!inp[i].reportValidity())
		return;
	
	update(sld[i].classList[1]);
}


function sliderInput() {
	let i = +this.parentElement.classList[1].slice(1);
	inp[i].value = val[i] = +this.value;
	
	curInp = sld[i].classList[1];
	
	//update();
	cancelAnimationFrame(this.r);
	this.r = requestAnimationFrame(update);
}


// 28/03/2022
function settingsChange(e) {
	let x = +e.target.classList[1].slice(1);
	switch (x) {
		case 0:
			inpanel.classList.toggle("hide-cap");
			break;
			
		case 1:
			live = !live;
			inpanel.classList.toggle("live");
			let n2 = document.querySelector(".settings-checkbox.n2");
			n2.disabled = !n2.disabled;
			if (live)
				updateSliderGrad();
			break;
			
		case 2:
			geek = !geek;
			inpanel.classList.toggle("geek");
			if (live && geek)
				updateSliderGrad();
			break;
			
		case 3:
			document.body.classList.toggle("light-theme");
			break;
	}
	
}

// 30/03/2022
function nameSearch() {
	name.autoWidth();
	if (!name.value) {
		result.innerHTML = "";
		return;
	}
	
	const A = [], max = 100;
	// allow user regexp
	const b = name.value.match(/(?=\W)[!-~]/) ? "" : "\\b";
	const rgx = new RegExp(b+name.value, "i");
	for (let c of colors) {
		if (c[0].match(rgx)) {
			A.push(c);
			if (A.length === max)
				break;
		}
	}
	
	let ih = "";
	for (let c of A) {
		let dark = lightness(c[2][0]);
		ih += `<div class="${dark}" style="background: ${c[1]}" onclick='setColor("${c[1]}");'>${c[0]}<span>${c[1]}</span></div>\n`;
	}
	
	result.innerHTML = ih;
	result.classList.add("active");
}


// 01/04/2022
function nearbyColors(e) {
	if (e.target.classList.contains("match")) {
		e.stopPropagation();
		if (result.classList.contains("active")) {
			result.classList.remove("active");
			return;
		}
		let A = Cc.near(hex[0].value, 10);
		A.sort((a, b) => (a[3]-b[3]));
		A = A.slice(0, 200);
		let ih = "";
		for (let c of A) {
			let dark = lightness(c[2][0]);
			ih += `<div class="${dark}" data-delta="${Math.round(c[3]*100)/100}" style="--match: ${c[1]}" onclick='setColor("${c[1]}");'>${c[0]}<span>${c[1]}</span></div>\n`;
		}
		result.innerHTML = ih;
		result.classList.add("active");
	} else
		setColor();
}

function lightness(l) {
	return (
		l < 45 ? "darker" :
		l < 70 ? "dark" :
		l < 85 ? "light" : "lighter"
	);
}

// 05/04/2022
function clearResult() {
	if (!result.classList.contains("active"))
		result.innerHTML = "";
}

// 03/04/2022
function globalClick(e) {
	// hide search result
	if (result.classList.contains("active"))
		result.classList.remove("active");
	
}

// 09/04/2022
function searchClick(e) {
	nameSearch();
	e.stopPropagation();
}

// 03/04/2022
function copyHex(e) {
	let str;
	if (e.target.classList.contains("given"))
		str = hex[0].value;
	else
		str = hex[1].innerHTML;
	
	str = str.toUpperCase()
	if (copy(str))
		alert("Copied: "+str);
}

function copy(str) {
	let el = document.createElement("textArea");
	document.body.appendChild(el);
	el.value = str;
	el.select();
	document.execCommand("copy");
	el.remove();
	return true;
}

function oline() {
	document.body.classList.toggle("outline");
}

function lg(...a) {
	console.log(...a);
}

function dbg(...a) {
	for (let b of a)
		console.log(b);
}
