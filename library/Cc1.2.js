/*
	Chromania Color Module - 31/03/2022 - @impawstarlight
	Notes:
	-> Almost all conversion functions (except rgb2hex & hex2rgb) expects normalized values in the form of 3 elements array.
	-> Use the nrgb & drgb functions to [de]normalize RGB values.
	-> Normal range is [0, 1] for RGB & S, V, L component of HSV & HSL.
	-> Normal range for Hue is [0, 360), whatever the colorspace.
	-> For CIE color-modes... it's complicated.
	
*/

const Cc = (function() {
	const {
			PI, sin, cos, atan2, sqrt, cbrt, round, min, max, abs, exp
		} = Math,
		rw = [95.047, 100, 108.883],
		_e = 216 / 24389, // 6^3/29^3
		_k = 24389 / 27,  // 29^3/3^3
		_u = 4*rw[0] / (rw[0] + 15*rw[1] + 3*rw[2]),
		_v = 9*rw[1]*_u / (4*rw[0]),
		deg = 180/PI;
	
	
	function nrgb(rgb) {
		rgb = rgb.slice(0);
		for (let i = 0; i < 3; i++)
			rgb[i] /= 255;
		return rgb;
	}
	
	function drgb(rgb) {
		rgb = rgb.slice(0);
		for (let i = 0; i < 3; i++)
			rgb[i] *= 255;
		return rgb;
	}
	
	function crgb(rgb) {
		a = max(...rgb, 255) - min(...rgb, 0);
		if (a > 255) {
			rgb = rgb.slice(0);
			for (let i = 0; i < 3; i++)
				rgb[i] = rgb[i] > 255 ? 255 : (rgb[i] < 0 ? 0 : rgb[i]);
		}
		return rgb;
	}
	
	function nhsx(hsx) {
		hsx = hsx.slice(0);
		for (let i = 1; i < 3; i++)
			hsx[i] /= 100;
		return hsx;
	}
	
	function dhsx(hsx) {
		hsx = hsx.slice(0);
		for (let i = 1; i < 3; i++)
			hsx[i] = hsx[i]*100;
		return hsx;
	}
	
	
	function grayscale(rgb) {
		let [r,g,b] = rgb;
		return (0.3*r + 0.59*g + 0.11*b);
	}
	
	
	function roundx(a, x) {
		a = a.slice(0);
		x = 10**x;
		for (let i = 0; i < 3; i++)
			a[i] = round(a[i]*x) / x;
		return a;
	}
	
	
	function rgb2hex(rgb) {
		let hex = "#";
		for (let i = 0; i < 3; i++) {
			x = round(rgb[i]);
			hex += (x  < 16 ? "0" : "") + x.toString(16);
		}
		return hex;
	}
	
	function hex2rgb(hex) {
		hex = hex.replace(/#/, "");
		let rgb = [hex.slice(0,2), hex.slice(2,4), hex.slice(4,6)];
		for (let i = 0; i < 3; i++)
			rgb[i] = parseInt(rgb[i], 16);
		return rgb;
	}
	
	
	function rgb2hsv(rgb) {
		let [r, g, b] = rgb;
		let h, s, v;
		
		v = max(r, g, b);
		s = v - min(r, g, b);
		
		if (!s)
			h = 0;
		else {
			let j = rgb.indexOf(v);
			h = 2*j + (rgb[++j%3] - rgb[++j%3]) / s;
			h += h < 0 ? 6 : 0;
			s /= v;
		}
		
		return [60*h, s, v];
	}
	
	function hsv2rgb(hsv) {
		let [h, s, v] = hsv;
		h /= 60;
		let rgb = [f(5), f(3), f(1)];
		return rgb;
		
		function f(n) {
			let k = (n + h) % 6;
			return v - v*s*max(min(k, 4-k, 1), 0);
		}
	}
	
	
	function rgb2hsl(rgb) {
		let [r, g, b] = rgb;
		let h, s, l;
		
		l = max(r, g, b);
		s = l - min(r, g, b);
		
		if (!s)
			h = 0;
		else {
			let j = rgb.indexOf(l);
			h = 2*j + (rgb[++j%3] - rgb[++j%3]) / s;
			h += h < 0 ? 6 : 0;
			l += l - s;
			s /=  min(l, 2-l);
			l /= 2;
		}
		
		return [60*h, s, l];
	}
	
	function hsl2rgb(hsl) {
		let [h, s, l] = hsl;
		h /= 30;
		let a = s*min(l, 1-l);
		let rgb = [f(0), f(8), f(4)];
		return rgb;
		
		function f(n) {
			let k = (n + h) % 12;
			return l - a*max(min(k-3, 9-k, 1), -1);
		}
	}
	
	
	function rgb2xyz(rgb) {
		rgb = rgb.slice(0);
		for (let i = 0; i < 3; i++) {
			if (rgb[i] > 0.04045)
				rgb[i] = ((rgb[i]+0.055) / 1.055) ** 2.4;
			else
				rgb[i] /= 12.92;
			rgb[i] *= 100;
		}
		
		let [r,g,b] = rgb;
		let x, y, z;
		
		x = r*0.4124564 + g*0.3575761 + b*0.1804375;
		y = r*0.2126729 + g*0.7151522 + b*0.0721750;
		z = r*0.0193339 + g*0.1191920 + b*0.9503041;
		
		return [x,y,z];
	}
	
	function xyz2rgb(xyz) {
		let [x,y,z] = xyz;
		let r, g, b;
		
		r =  x*3.2404542 - y*1.5371385 - z*0.4985314;
		g = -x*0.9692660 + y*1.8760108 + z*0.0415560;
		b =  x*0.0556434 - y*0.2040259 + z*1.0572252;
		
		let rgb = [r,g,b];
		
		let _04045 = 0.04045 / 12.92;
		for (let i = 0; i < 3; i++) {
			rgb[i] /= 100;
			if (rgb[i] > _04045)
				rgb[i] = rgb[i]**(5/12) * 1.055 - 0.055;
			else
				rgb[i] *= 12.92;
		}
		
		return rgb;
	}
	
	
	function xyz2lab(xyz) {
		xyz = xyz.slice(0);
		for (let i = 0; i < 3; i++) {
			xyz[i] /= rw[i];
			if (xyz[i] > _e)
				xyz[i] = cbrt(xyz[i]);
			else
				xyz[i] = (_k*xyz[i]+16) / 116;
		}
		
		let [x,y,z] = xyz;
		let l, a, b;
		l = 116*y - 16;
		a = 500*(x-y);
		b = 200*(y-z);
		
		return [l,a,b];
	}
	
	function lab2xyz(lab) {
		let [l,a,b] = lab;
		
		let x, y, z;
		y = (l+16) / 116;
		x = y + a/500;
		z = y - b/200;
		
		let xyz = [x,y,z];
		
		let cbrt_e = cbrt(_e);
		for (let i = 0; i < 3; i++) {
			if (xyz[i] > cbrt_e)
				xyz[i] = xyz[i]**3;
			else
				xyz[i] = (116*xyz[i] - 16) / _k;
			xyz[i] *= rw[i];
		}
		
		return xyz;
	}
	
	
	function xyz2luv(xyz) {
		let [x,y,z] = xyz;
		if (x+y+z === 0)
			return [0, 0, 0];
		
		let _y = y/rw[1];
		
		let l, u, v;
		
		u = 4*x / (x + 15*y + 3*z);
		v = 9*y*u / (4*x);
		
		l = _y > _e ? 116*cbrt(_y) - 16 : _k*_y;
		u = 13*l * (u - _u);
		v = 13*l * (v - _v);
		
		return [l, u, v];
	}
	
	function luv2xyz(luv) {
		if (luv[0] === 0)
			return [0, 0, 0];
		
		let [l, u, v] = luv;
		u = _u + u/(13*l);
		v = _v + v/(13*l);
		
		let x, y, z;
		
		y = (l > 8) ? ((l+16)/116)**3 : l/_k;
		y *= 100;
		x = y*9*u/(4*v);
		z = y*(12-3*u-20*v)/(4*v);
		
		return [x, y, z];
	}
	
	
	function lab2lch(lab) {
		if (lab[2] === undefined)
			lab.unshift(NaN);
		
		let [l,a,b] = lab;
		let c, h;
		c = sqrt(a**2 + b**2);
		h = atan2(b,a)*180/PI;
		h += h < 0 ? 360 : 0;
		
		return [l,c,h].slice(l !== l ? 1 : 0);
	}
	
	function lch2lab(lch) {
		if (lch[2] === undefined)
			lch.unshift(NaN);
		
		let [l,c,h] = lch;
		let a, b;
		let _h = h*PI/180;
		a = c*cos(_h);
		b = c*sin(_h);
		
		return [l,a,b].slice(l !== l ? 1 : 0);
	}
	
	
	function dist(col1, col2) {
		let [f,g,h] = col1,
			[i,j,k] = col2;
		
		return sqrt((i-f)**2 + (j-g)**2 + (k-h)**2);
	}
	
	function dist2(col1, col2) {
		let [f,g,h] = col1,
			[i,j,k] = col2;
		
		return (i-f)**2 + (j-g)**2 + (k-h)**2;
	}
	
	function deltaE94(lab1, lab2) {
		let [L1,a1,b1] = lab1,
			[L2,a2,b2] = lab2;
		let
			dL = L1-L2,
			C1 = sqrt(a1**2 + b1**2),
			C2 = sqrt(a2**2 + b2**2),
			dC = C1-C2,
			dH = sqrt((a1-a2)**2 + (b1-b2)**2 - dC**2),
			Sc = 1.045*C1,
			Sh = 1.015*C1;
		
		return sqrt(dL**2 + (dC/Sc)**2 + (dH/Sh)**2);
	}
	
	function deltaE00_old(lab1, lab2) {
		let [L1,a1,b1] = lab1,
			[L2,a2,b2] = lab2;
		let
			_L_ = (L1+L2)/2,
			C1  = sqrt(a1**2 + b1**2),
			C2  = sqrt(a2**2 + b2**2),
			C_  = (C1+C2)/2,
			G   = (1 - sqrt(C_**7 / (C_**7 + 25**7))) / 2,
			_a1 = a1*(1+G),
			_a2 = a2*(1+G),
			_C1 = sqrt(_a1**2 + b1**2),
			_C2 = sqrt(_a2**2 + b2**2),
			_C_ = (_C1+_C2)/2,
			_h1 = atan2(b1, _a1)*deg,
			_h2 = atan2(b2, _a2)*deg;
		
		_h1  += _h1 < 0 ? 360 : 0;
		_h2  += _h2 < 0 ? 360 : 0;
		
		let _H_ = (_h1+_h2)/2;
		_H_    += abs(_h1-_h2) > 180 ? 180 : 0;
		
		let
			T   = 1 - 0.17*cos((_H_-30)/deg) + 0.24*cos((2*_H_)/deg) + 0.32*cos((3*_H_+6)/deg) - 0.2*cos((4*_H_-63)/deg),
			_dh = _h2 - _h1;
		_dh  += abs(_dh) <= 180 ? 0 : abs(_dh) > 180 && _h2 <= _h1 ? 360 : -360;
		
		let
			_dL = L2 - L1,
			_dC = _C2 - _C1,
			_dH = 2*sqrt(_C1*_C2)*sin((_dh/2)/deg),
			Sl  = 1 + (0.015*(_L_-50)**2) / sqrt(20+(_L_-50)**2),
			Sc  = 1 + 0.045*_C_,
			Sh  = 1 + 0.015*_C_*T,
			dth = 30*exp(-(((_H_-275)/25)**2)),
			Rc  = 2 * sqrt(_C_**7 / (_C_**7 + 25**7)),
			RT  = -Rc*sin((2*dth)/deg);
		
		return sqrt((_dL/Sl)**2 + (_dC/Sc)**2 + (_dH/Sh)**2 + RT*_dC*_dH/(Sc*Sh)); 
	}
	
	// rewrite 05/04/2022
	function deltaE00(lab1, lab2) {
		let [l1,a1,b1] = lab1,
			[l2,a2,b2] = lab2;
		
		let dL = l2-l1,
			L_ = (l1+l2)/2,
			C_ = (sqrt(a1**2 + b1**2) + sqrt(a2**2 + b2**2))/2,
			
			tmp = (1 - sqrt(C_**7 / (C_**7 + 25**7))) / 2,
			_a1 = a1*(1+tmp),
			_a2 = a2*(1+tmp),
			
			_C1 = sqrt(_a1**2 + b1**2),
			_C2 = sqrt(_a2**2 + b2**2),
			_dC = _C2 - _C1,
			_C_ = (_C1 + _C2)/2,
			
			_h1 = _C1 && atan2(b1, _a1)*deg,
			_h2 = _C2 && atan2(b2, _a2)*deg;
		
		if (_h1 < 0) _h1 += 360;
		if (_h2 < 0) _h2 += 360;
		
		let _dh = _h2 - _h1,
			_H_ = (_h1+_h2)/2,
			_dH = _C1*_C2;
		
		if (!_dH) {
			_H_ *= 2; // G. Sharma 2005 et al
		} else if (abs(_dh) > 180) {
			_dh += (_dh < 0) ? 360 : -360;
			_H_ += (_H_ < 180) ? 180 : -180; // previously wrong?
		}
		
		_dH = _dH && 2*sqrt(_dH)*sin((_dh/2)/deg);
		
		tmp = (L_ - 50 )**2;
		let SL = 1 + (0.015*tmp) / sqrt(20+tmp),
			SC = 1 + 0.045 * _C_;
		
		tmp = 1 - 0.17*cos((_H_ - 30)/deg) + 0.24*cos((2 * _H_)/deg) + 0.32*cos((3 * _H_ + 6)/deg) - 0.2*cos((4 * _H_ - 63)/deg);
		let SH = 1 + 0.015 * _C_ * tmp,
			RT = 2 * sqrt(_C_**7 / (_C_**7 + 25**7));
			
		tmp = 60*exp(- (((_H_ - 275)/25)**2 ) );
		RT  = -RT*sin((tmp)/deg);
		
		tmp = (dL/SL)**2
			+ (_dC/SC)**2
			+ (_dH/SH)**2
			+ RT * _dC * _dH / (SC*SH);
		
		return sqrt(tmp);
	}
	
	
	// new: OKLAB - 05/04/2022
	
	function xyz2oklab(xyz) {
		let [x,y,z] = xyz;
		x /= 100;
		y /= 100;
		z /= 100;
		
		let l, m, s;
		// 06/04/2022 - updated matrices from GitHub/LeaVero/color.js
		l = cbrt(0.8190224432164319  *x + 0.3619062562801221 *y - 0.12887378261216414*z);
		m = cbrt(0.0329836671980271  *x + 0.9292868468965546 *y + 0.03614466816999844*z);
		s = cbrt(0.048177199566046255*x + 0.26423952494422764*y + 0.6335478258136937 *z);
		
		/*
		l = cbrt(x * 0.8189330101 + y * 0.3618667424 - z * 0.1288597137);
		m = cbrt(x * 0.0329845436 + y * 0.9293118715 + z * 0.0361456387);
		s = cbrt(x * 0.0482003018 + y * 0.2643662691 + z * 0.6338517070);
		*/
		
		let L, a, b;
		L = l * 0.2104542553 + m * 0.7936177850 - s * 0.0040720468;
		a = l * 1.9779984951 - m * 2.4285922050 + s * 0.4505937099;
		b = l * 0.0259040371 + m * 0.7827717662 - s * 0.8086757660;
		
		L *= 100;
		a *= 100;
		b *= 100;
		return [L,a,b];
	}
	
	
	function oklab2xyz(oklab) {
		let [L,a,b] = oklab;
		L /= 100;
		a /= 100;
		b /= 100;
		
		let l, m, s;
		l = (0.99999999845051981432*L + 0.39633779217376785678 *a + 0.21580375806075880339 *b)**3;
		m = (1.0000000088817607767 *L - 0.1055613423236563494  *a - 0.063854174771705903402*b)**3;
		s = (1.0000000546724109177 *L - 0.089484182094965759684*a - 1.2914855378640917399  *b)**3;
		
		let x, y, z;
		x =  1.2268798733741557 *l - 0.5578149965554813*m + 0.28139105017721583*s;
		y = -0.04057576262431372*l + 1.1122868293970594*m - 0.07171106666151701*s;
		z = -0.07637294974672142*l - 0.4214933239627914*m + 1.5869240244272418 *s;
		
		x *= 100;
		y *= 100;
		z *= 100;
		return [x,y,z];
	}
	
	
	let _ = {
		nrgb, // normalize and
		drgb, // denormalize rgb
		crgb, // clip rgb in case values are out of [0, 255] range
		nhsx, // normalize and
		dhsx, // denormalize hsv or hsl
		grayscale, // get the grayscale value from an rgb color
		roundx, // round a number at xth digit after the decimal point
		
		rgb2hex,
		rgb2hsv,
		rgb2hsl,
		rgb2xyz,
		rgb2lab: (rgb) => xyz2lab(rgb2xyz(rgb)),
		rgb2luv: (rgb) => xyz2luv(rgb2xyz(rgb)),
		rgb2lchab: (rgb) => lab2lch(_.rgb2lab(rgb)),
		rgb2lchuv: (rgb) => lab2lch(_.rgb2luv(rgb)),
		rgb2oklab: rgb => xyz2oklab(rgb2xyz(rgb)),
		rgb2oklch: (rgb) => lab2lch(_.rgb2oklab(rgb)),
		
		hex2rgb,
		hsv2rgb,
		hsl2rgb,
		xyz2rgb,
		lab2rgb: (lab) => xyz2rgb(lab2xyz(lab)),
		luv2rgb: (luv) => xyz2rgb(luv2xyz(luv)),
		lchab2rgb: (lch) => _.lab2rgb(lch2lab(lch)),
		lchuv2rgb: (lch) => _.luv2rgb(lch2lab(lch)),
		oklab2rgb: (oklab) => xyz2rgb(oklab2xyz(oklab)),
		oklch2rgb: (oklch) => _.oklab2rgb(lch2lab(oklch)),
		
		xyz2lab,
		lab2xyz,
		xyz2luv,
		luv2xyz,
		xyz2oklab,
		oklab2xyz,
		
		lab2lch,
		lch2lab,
		luv2lch: lab2lch,
		lch2luv: lch2lab,
		oklab2oklch: lab2lch,
		oklch2oklab: lch2lab,
		
		dist,
		dist2,
		deltaE76: dist,
		deltaE94,
		deltaE00,
		deltaE00_old,
		
		// Shortcuts for Chromania
		rgb2dhsv: (rgb) => dhsx(rgb2hsv(rgb)),
		rgb2dhsl: (rgb) => dhsx(rgb2hsl(rgb)),
		dhsv2rgb: (hsv) => hsv2rgb(nhsx(hsv)),
		dhsl2rgb: (hsl) => hsl2rgb(nhsx(hsl)),
		// 03/04/2022
		nrgb2safehex: rgb => rgb2hex(crgb(drgb(rgb))),
		// gamut mapping opti - 09/04/2022
		xyz2oklch: xyz => lab2lch(xyz2oklab(xyz)),
		lab2oklch: lab => _.xyz2oklch(lab2xyz(lab)),
		luv2oklch: luv => _.xyz2oklch(luv2xyz(luv)),
		lchab2oklch: lch => _.xyz2oklch(lab2xyz(lch2lab(lch))),
		lchuv2oklch: lch => _.xyz2oklch(luv2xyz(lch2lab(lch))),
		oklch2oklch: lch => lch,
		
		// ntc
		initNames,
		name,
		name0,
		name_compact,
		name_full,
		near,
		far,
		
		// gamut mapping
		rgbClip,
		maxChroma,
		chromaClipBin,
		chromaClipLUT,
		chromaClip,
		projectLcusp,
		projectLcus,
		projectL,
		adaptiveL
	};
	
	
	initNames();
	function initNames() {
		try {
			colors = colors.split("\n");
		} catch(e) {
			alert(e+"\nMake sure colornames.js is loaded before Cc.js");
			console.log(e+"\nMake sure colornames.js is loaded before Cc.js");
			return;
		}
		
		for (let i = colors.length-1; i > -1; i--) {
			colors[i] = colors[i].split(",");
			colors[i].push(_.rgb2lab(nrgb(hex2rgb(colors[i][1]))));
		}
		//nameOptiRange();
	}
	
	
	function name(color) {
		if (color.length < 6) return null;
		if (colors.length < 5000)
			return name_compact(color);
		else
			return name_full(color);
	}
	
	function name_compact(color) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let nd = -1, df = 999, n = 0;
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			if  (abs(lab1[0]-lab2[0]) < 10 &&
			     abs(lab1[1]-lab2[1]) < 25 &&
			     abs(lab1[2]-lab2[2]) < 30) {
				let d = deltaE00(lab1, lab2);
				if (d < df) {
					df = d;
					nd = i;
				}
				n++;
			}
		}
		return colors[nd].slice(0, 2).concat(df, nd, n);
	}
	
	
	function name_full(color) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let nd = -1, df = 999, n = 0;
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			if  (abs(lab1[0]-lab2[0]) < 10 &&
			     abs(lab1[1]-lab2[1]) < 20 &&
			     abs(lab1[2]-lab2[2]) < 25) {
				let d = deltaE00(lab1, lab2);
				if (d < df) {
					df = d;
					nd = i;
				}
				n++;
			}
		}
		
		return colors[nd].slice(0, 2).concat(df, nd, n);
	}
	
	
	function name0(color) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let nd = -1, df = 999;
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			let d = deltaE00(lab1, lab2);
			if (d < df) {
				df = d;
				nd = i;
			}
		}
		
		return colors[nd].slice(0, 2).concat(df, nd);
	}
	
	
	function nameOptiRange() {
		let Dd = [];
		
		for (let n = 0; n < 10000; n++) {
			let lab1 = _.rgb2lab(nrgb(hex2rgb("#"+Math.random().toString(16).slice(-6))));
			let df = 999;
			let D;
			
			for (let i = 0; i < colors.length; i++) {
				//if (i === n) continue;
				let lab2 = colors[i][2];
				let ll = lab1[0] - lab2[0],
					aa = lab1[1] - lab2[1],
					bb = lab1[2] - lab2[2];
				
				if  (abs(ll) < 10 &&
				     abs(aa) < 25 &&
				     abs(bb) < 30) {
					let d = deltaE00(lab1, lab2);
					if (d < df) {
						df = d;
						D  = [ll,aa,bb]
					}
				}
			}
			Dd.push(D);
		}
		
		Dd.sort((x, y) => y[0]-x[0]);
		console.log(Dd[0]);
		Dd.sort((x, y) => y[1]-x[1]);
		console.log(Dd[0]);
		Dd.sort((x, y) => y[2]-x[2]);
		console.log(Dd[0]);
		
		return Dd;
	}
	
	
	function near(color, range) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let arr = [];
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			let d = deltaE00(lab1, lab2);
			if (d <= range)
				arr.push(colors[i].concat(d, i));
		}
		
		return arr;
	}
	
	
	function far(color, range, range2 = 100) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let arr = [];
		range *= range;
		range2 *= range2;
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			let d = dist2(lab1, lab2);
			if (d > range && d < range2)
				arr.push(colors[i].concat(sqrt(d), i));
		}
		
		return arr;
	}
	
	
	// gamut mapping funcs
	
	function rgbClip(rgb, denormalized) {
		rgb = rgb.slice();
		let n = 1;
		if (denormalized)
			n = 255;
		
		for (let i = 0; i < 3; i++)
			if (rgb[i] > n)
				rgb[i] = n;
			else if (rgb[i] < 0)
				rgb[i] = 0;
		
		return rgb;
	}
	
	function maxChroma(oklch) {
		let [L,C,H] = oklch;
		L = min(max(L, 0), 100);
		let C0 = 0, C1 = 40.96;
		
		while (true) {
			C = (C0+C1)/2;
			rgb = Cc.oklch2rgb([L,C,H]);
			range = Math.max(...rgb, 1) - Math.min(...rgb, 0);
			//if (range < 1.00196) {
				//if (range > 1) break;
			if (range === 1) {
				if (C-C0 <= 0.0101) break;
				C0 = C;
			} else
				C1 = C;
		}
		
		return [L,C,H];
	}
	
	function chromaClipBin(rgb) {
		let range = max(...rgb, 1) - min(...rgb, 0);
		if (range <= 1.00196)
			return rgb;
		
		let [L,C,H] = _.rgb2oklch(rgb);
		L = min(max(L, 0), 100);
		let C0 = 0, C1 = 51.2;
		
		while (true) {
			C = (C0+C1)/2;
			rgb = Cc.oklch2rgb([L,C,H]);
			range = Math.max(...rgb, 1) - Math.min(...rgb, 0);
			if (range < 1.00196) {
				if (range > 1) break;
				C0 = C;
			} else
				C1 = C;
		}
		
		return rgb;
	}
	
	function projectLokBin(lch, L0) {
		let [L,C,H] = lch;
		let C0 = 0;
		let [L1,C1] = [L,C];
		
		this.c = 0;
		while (true) {
			L = (L0+L1)/2;
			C = (C0+C1)/2;
			rgb = Cc.oklch2rgb([L,C,H]);
			range = Math.max(...rgb, 1) - Math.min(...rgb, 0);
			if (range < 1.00196) {
				if (range > 1) break;
				[L0, C0] = [L, C];
			} else
				[L1, C1] = [L, C];
			
			this.c++
		}
		
		return rgb;
	}
	
	function chromaClipLUT(rgb) {
		let range = max(...rgb, 1) - min(...rgb, 0);
		if (range <= 1)
			return rgb;
		
		let [L,C,H] = _.rgb2oklch(rgb);
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 1 : 99;
		C = Cm*(L-L0)/(Lm-L0);
		
		return Cc.rgbClip(Cc.oklch2rgb([L,C,H]));
	}
	
	function chromaClip(lch) {
		let [L,C,H] = lch;
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 0 : 100;
		Cm =  Cm*(L-L0)/(Lm-L0);
		let a = Cm/C;;
		
		if (a < 0.99)
			C = Cm;
		else
			a = 1;
		return [...Cc.rgbClip(Cc.oklch2rgb([L,C,H])), a];
	}
	
	function projectL(rgb, L0 = 50) {
		let range = max(...rgb, 1) - min(...rgb, 0);
		if (range <= 1)
			return rgb;
		
		return projectLok(_.rgb2oklch(rgb), L0);
	}
	
	function projectLok(lch, Lp) {
		let [L,C,H] = lch;
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 1 : 99;
		C = (Lp-L0) / ((Lm-L0)/Cm - (L-Lp)/C);
		return Cc.rgbClip(Cc.oklch2rgb([L,C,H]));
	}
	
	function projectLcus(lch) {
		let [L,C,H] = lch;
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 1 : 99;
		
		let lmc = (Lm-L0)/Cm;
		Cm =  (L-L0)/lmc;
		if (C > Cm) {
			C = (Lm-L0) / (lmc - (L-Lm)/C);
			L = C*lmc + L0;
		}
		return Cc.rgbClip(Cc.oklch2rgb([L,C,H]));
	}
	
	function projectLcusp(rgb) {
		let range = max(...rgb, 1) - min(...rgb, 0);
		if (range <= 1)
			return rgb;
		let [L,C,H] = _.rgb2oklch(rgb);
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 1 : 99;
		C = (Lm-L0) / ((Lm-L0)/Cm - (L-Lm)/C);
		L = C*(Lm-L0)/Cm + L0;
		return Cc.rgbClip(Cc.oklch2rgb([L,C,H]));
	}
	
	function adaptiveL(rgb) {
		let [L,C,H] = _.rgb2oklch(rgb);
		let [Lm,Cm] = cuspLUT[round(2*H)];
		let L0 = L < Lm ? 1 : 99;
		;;let Lp = Math.tanh(L);
		C = (Lp-L0) / ((Lm-L0)/Cm - (L-Lp)/C);
		return Cc.rgbClip(Cc.oklch2rgb([L,C,H]));
	}
	
	
	return _;
})();



