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
		a = max(rgb[0], rgb[1], rgb[2], 255) - min(rgb[0], rgb[1], rgb[2], 0);
		if (a > 255) {
			rgb = rgb.slice(0);
			for (let i = 0; i < 3; i++)
				rgb[i] = rgb[i] > 255 ? 255 : (rgb[i] < 0 ? 0 : rgb[i]);
		}
		return rgb;
	}
	
	function srgb(rgb) {
		a = max(rgb[0], rgb[1], rgb[2], 255);
		b = min(rgb[0], rgb[1], rgb[2], 0);
		a -= b;
		if (a > 255) {
			rgb = rgb.slice(0);
			a = 255/a;
			for (let i = 0; i < 3; i++)
				rgb[i] = (rgb[i] - b) * a;
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
		for (let x of rgb)
			hex += ((x = Math.round(x)) < 16 ? "0" : "") + x.toString(16);
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
		let [l, u, v] = luv;
		let x, y, z;
		
		(!l) && (l = 0.1); // fix div by zero
		
		u = _u + u/(13*l);
		v = _v + v/(13*l);
		
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
	
	
	function deltaE76(lab1, lab2) {
		let [f,g,h] = lab1,
				[i,j,k] = lab2;
		
		return sqrt((i-f)**2 + (j-g)**2 + (k-h)**2);
		
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
	
	function deltaE00(lab1, lab2) {
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
	
	
	
	
	
	let _ = {
		nrgb, // normalize and
		drgb, // denormalize rgb
		crgb, // clip rgb in case values are out of [0, 255] range
		srgb, // scale ^^^
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
		
		hex2rgb,
		hsv2rgb,
		hsl2rgb,
		xyz2rgb,
		lab2rgb: (lab) => xyz2rgb(lab2xyz(lab)),
		luv2rgb: (luv) => xyz2rgb(luv2xyz(luv)),
		lchab2rgb: (lch) => _.lab2rgb(lch2lab(lch)),
		lchuv2rgb: (lch) => _.luv2rgb(lch2lab(lch)),
		
		xyz2lab,
		lab2xyz,
		xyz2luv,
		luv2xyz,
		
		lab2lch,
		lch2lab,
		luv2lch: lab2lch,
		lch2luv: lch2lab,
		
		deltaE76,
		deltaE94,
		deltaE00,
		
		// Denormalized for Chromania
		rgb2dhsv: (rgb) => dhsx(rgb2hsv(rgb)),
		rgb2dhsl: (rgb) => dhsx(rgb2hsl(rgb)),
		dhsv2rgb: (hsv) => hsv2rgb(nhsx(hsv)),
		dhsl2rgb: (hsl) => hsl2rgb(nhsx(hsl)),
		
		// ntc
		name,
		name0,
		name_compact,
		name_full,
		near
	};
	
	
	(function initNames() {
		colors = colors.split("\n");
		for (let i = colors.length-1; i > -1; i--) {
			colors[i] = colors[i].split(",");
			colors[i].push(_.rgb2lab(nrgb(hex2rgb(colors[i][1]))));
		}
	})();
	
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
		return colors[nd].slice(0, 2).concat(nd, df, n);
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
		
		return colors[nd].slice(0, 2).concat(nd, df, n);
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
		
		return colors[nd].slice(0, 2).concat(nd, df);
	}
	
	function near(color, range) {
		color = color.toLowerCase();
		let lab1 = _.rgb2lab(nrgb(hex2rgb(color)));
		let arr = [];
		
		for (let i = 0; i < colors.length; i++) {
			let lab2 = colors[i][2];
			let d = deltaE00(lab1, lab2);
			if (d <= range)
				arr.push(colors[nd].slice(0, 2).concat(nd, df));
		}
		
		return arr;
	}
	
	return _;
})();



