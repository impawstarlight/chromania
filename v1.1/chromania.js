let live = false, geek = false;
let tmo; // timeout handle for updateOutput...

const
	gid = str => document.getElementById(str) 
	gcl = str => document.getElementsByClassName(str);

let name, result, box, hex, inpanel, inp, btn, sld, dss;
let val = []; // array holding all color space values for the current color

let _ = [
	[0, 255],
	[0, 360],
	[0, 100],
	[0, 95],
	[0, 109],
	[-87, 99],
	[-108, 85],
	[0, 134],
	[-84, 175],
	[-134, 108],
	[0, 179]
];

let data = { // bounds for colorspace components
	rgb: {r: _[0], g: _[0], b: _[0]},
	hsv: {h: _[1], s: _[2], v: _[2]},
	hsl: {h: _[1], s: _[2], l: _[2]},
	xyz: {x: _[3], y: _[2], z: _[4]},
	lab: {l: _[2], a: _[5], b: _[6]},
	luv: {l: _[2], u: _[8], v: _[9]},
	lchab: {l: _[2], c: _[7], h: _[1]},
	lchuv: {l: _[2], c: _[10], h: _[1]} // 29/10/2021
};

// initialize everything
window.onload = () => {
	createInputPanel();
	
	name = gid("color-name");
	result = gid("search-result");
	box = gcl("box");
	hex = gcl("hex");
	inp = gcl("numinp");
	btn = gcl("capbtn");
	sld = gcl("slider");
	dss = gid("dss").sheet.cssRules[0].style;
	
	// copy hex
	for (let x of gcl("copy-icon"))
		x.addEventListener("click", copyHex);
	
	// toggle colorspace visibility
	let cn = gcl("colorspace-name");
	for (let x of cn)
		x.addEventListener("click", function() { this.parentElement.classList.toggle("collapse"); livegradcie(); });
	
	// settings event
	gid("settings-icon").addEventListener("click", function() { gid("settings").classList.toggle("collapse"); this.classList.toggle("active"); });
	let sc = gcl("settings-checkbox");
	for (let x of sc)
		x.addEventListener("change", settingsChange);
	
	// more events
	box[0].addEventListener("click", nearbyColors);
	hex[0].addEventListener("input", hexInput);
	hex[1].addEventListener("click", hexClick);
	for (let i = 0; i < inp.length; i++) {
		inp[i].addEventListener("input", numInput);
		btn[i].addEventListener("click", btnInput);
		sld[i].addEventListener("input", sliderInput);
	}
	
	// name search
	name.autoWidth = function() { this.style.width = "calc("+this.value.length+"ch + 64px)"; }
	name.addEventListener("input", nameSearch);
	window.addEventListener("click", globalClick);
	result.addEventListener("transitionend", clearResult);
	
	// random color
	setColor();
	
	// initial preference
	cn[0].click();
	cn[4].click();
	sc[0].click();
	sc[1].click();
	
}


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
			iHTML += `
				<div class="container n${i++}">
					<div class="cap-wrapper">
						<div class="capsule capinp">
							<div class="cap-left">${c}</div>
							<input class="cap-right numinp" type="number" min="${b[0]}" max="${b[1]}" step="${d == "rgb" ? 1 : 0.1}">
						</div>
						<div class="capsule capbtn">
							<div class="cap-left">-</div>
							<div class="cap-right">+</div>
						</div>
					</div>
					<input class="slider ${d} ${c}" type="range" min="${b[0]}" max="${b[1]}" step="1">
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
	
	let h = val[3]; // preserve hsv/hsl hue value in case of a saturation sweep
	
	let rgb = Cc[method](val.slice(index, index+3));
	let xyz = Cc.rgb2xyz(rgb);
	let lab = Cc.xyz2lab(xyz);
	let luv = Cc.xyz2luv(xyz);
	
	val = [
		...Cc.roundx(Cc.drgb(rgb), 0),
		...Cc.rgb2dhsv(rgb),
		...Cc.rgb2dhsl(rgb),
		...xyz,
		...lab,
		...luv,
		...Cc.lab2lch(lab),
		...Cc.luv2lch(luv)
	];
	
	// preserve hue...
	if (str === "hsv" || str === "hsl")
		val[3] = val[6] = h;
	
	// round to 1 digit after decimal point
	for (let i = 3; i < val.length; i++)
		val[i] = Math.round(val[i]*10)/10;
	
	// set input element values
	for (let i = 0; i < val.length; i++)
		if (str !== sld[i].classList[1])
			inp[i].value = sld[i].value = val[i];
		else
			val[i] = +inp[i].value;
	
	
	// rearranging update sequence - 04/04/2022
	
	// set color
	rgb = val.slice(0, 3);
	let clamped_rgb = Cc.crgb(rgb);
	let color = Cc.rgb2hex(clamped_rgb);
	dss.setProperty("--given", color);
	dss.setProperty("--match", color);
	lg(true)
	if (clamped_rgb != rgb)
		color += "*";
	hex[0].value = color;
	
	// timeout to optimize slider
	tmo = setTimeout(updateName, 0);
	clearTimeout(this.t);
	this.t = setTimeout(updateSliderGrad, 20);
}


function updateName() {
	let color = hex[0].value;
	let match = Cc.name(color);
	hex[1].innerHTML = match[1];
	name.value = match[0];
	name.autoWidth();
	
	// 07/08/2020
	dss.setProperty("--match", match[1]);
	
	// 29/07/2020
	box[1].innerHTML = Math.round(match[3]*100)/100;
	
	// 09/07/2020
	if (color === match[1])
		hex[1].parentElement.style.opacity = "0.5";
	else
		hex[1].parentElement.style.opacity = "";
	
}

// 04/04/2022
function updateSliderGrad() {
	livegradrgb();
	livegradcie();
}

// 26/03/2022
function livegradcie() {
	const {max, min, floor} = Math;
	const D = 1;
	const L = [];
	
	for (let i = 9; i < 24; i++) {
		if (sld[i].parentElement.parentElement.classList.contains("collapse"))
			continue;
		let cl = sld[i].classList;
		let b = data[cl[1]][cl[2]];
		let method = cl[1]+"2rgb";
		let imdex = i%3; // noimce
		let index = i-imdex;
		let arr = val.slice(index, index+3);
		let A = geek ? [[],[],[]] : [[]];
		let GR = [];
		
		let j = cl[1] === "lchab" ? 0 :
		        cl[1] === "lchuv" ? 1 : -1;
		// use lab/luv l gradient in lch if available
		if (cl[2] === "l" && !imdex && L[j]) {
			GR = L[j];
		} else {
			for (let x = b[0]; x < b[1]; x += D) {
				arr[imdex] = x;
				let rgb = Cc.drgb(Cc[method](arr));
				let range = max(255, ...rgb) - min(0, ...rgb);
				if (geek) {
					if (range > 255) {
						rgb = Cc.crgb(rgb);
						let a = 255/range;
						A[0].push(Cc.rgb2hex(rgb));
						A[1].push("transparent");
						A[2].push(`rgba(${[...rgb, a].join()})`);
						
					}
					else
						for (let p of A)
							p.push(Cc.rgb2hex(rgb));
				} else
					A[0].push(Cc.rgb2hex(Cc.crgb(rgb)));
			}
			
			for (let gr of A)
				GR.push(`linear-gradient(to right, ${gr.join()})`);
			
			if (!geek) // initial transition fix - 04/04/2022
				GR.push("none", "none");
			
			if (cl[2] === "l")
				L[j] = GR;
		}
		
		sld[i].style.backgroundImage = GR.join();
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
		GR.push(Cc.rgb2hex(Cc.crgb(arr)));
		arr[imdex] = 255;
		GR.push(Cc.rgb2hex(Cc.crgb(arr)));
		sld[i].style.backgroundImage = `none, linear-gradient(to right, ${GR.join()})`;
		
	}
	
	// sv, sl
	for (let i = 4; i < 9; i++) {
		if (i === 6) continue;
		let method = "d" + sld[i].classList[1] + "2rgb";
		let imdex = i%3; // noimce
		let index = i-imdex;
		let arr = val.slice(index, index+3);
		let GR = [];
		
		arr[imdex] = 0;
		GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		if (i === 8) {
			arr[imdex] = 50;
			GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		}
		arr[imdex] = 100;
		GR.push(Cc.nrgb2safehex(Cc[method](arr)));
		sld[i].style.backgroundImage = `none, linear-gradient(to right, ${GR.join()})`;
	}
	
	// h, h
	let H = [];
	let arr = val.slice(3, 6);
	for (let i = 0; i <= 6; i++) {
		arr[0] = 60*i;
		H.push(Cc.nrgb2safehex(Cc.dhsv2rgb(arr)));
	}
	
	H = `none, linear-gradient(to right, ${H.join()})`;
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
	
	let i = this.parentElement.parentElement.parentElement.classList[1].slice(1);
	sld[i].value = val[i] = +this.value;
	
	update(sld[i].classList[1]);
}


function btnInput(e) {
	let i = this.parentElement.parentElement.classList[1].slice(1);
	let x = e.target.className == "cap-right" ? 1 : -1;
	inp[i].value = sld[i].value = val[i] += x;
	
	if (!inp[i].reportValidity())
		return;
	
	update(sld[i].classList[1]);
}


function sliderInput() {
	let i = this.parentElement.classList[1].slice(1);
	inp[i].value = val[i] = +this.value;
	
	// timeout to prevent excessive continuous computational overload
	clearTimeout(this.t);
	this.t = setTimeout(update, 0, sld[i].classList[1]);
	clearTimeout(tmo);
}

// 28/03/2022
function settingsChange(e, t) {
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
	if (!this.value) {
		result.innerHTML = "";
		return;
	}
	
	const A = [], max = 100;
	// allow user regexp
	const b = this.value.match(/(?=\W)[!-~]/) ? "" : "\\b";
	const rgx = new RegExp(b+this.value, "i");
	for (let c of colors) {
		if (c[0].match(rgx)) {
			A.push(c);
			if (A.length === max)
				break;
		}
	}
	
	let ih = "";
	for (let c of A) {
		let dark = c[2][0] < 45 ? "darker" :
		           c[2][0] < 70 ? "dark" :
		           c[2][0] < 85 ? "light" : "lighter";
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
		let A = Cc.near(hex[0].value, 15);
		A.sort((a, b) => (a[3]-b[3]));
		A = A.slice(0, 100);
		let ih = "";
		for (let c of A) {
			let dark = c[2][0] < 45 ? "darker" :
			           c[2][0] < 70 ? "dark" :
			           c[2][0] < 85 ? "light" : "lighter";
			ih += `<div class="${dark}" data-delta="${Math.round(c[3]*100)/100}" style="--match: ${c[1]}" onclick='setColor("${c[1]}");'>${c[0]}<span>${c[1]}</span></div>\n`;
		}
		result.innerHTML = ih;
		result.classList.add("active");
	} else
		setColor();
}

// 05/04/2022
function clearResult() {
	if (!result.classList.contains("active"))
		result.innerHTML = "";
}

// 03/04/2022
function globalClick(e) {
	// hide search result
	if (result.classList.contains("active") && e.target.id !== name.id)
		result.classList.remove("active");
	
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