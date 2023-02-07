"use strict"

// TODO: change let to const where possible

const Cg = {
	// gpu-ifying functions - 5 Feb 2023
	// double name for gpu.js
	
	nrgb: function nrgb(rgb) {
		return [rgb[0]/255, rgb[1]/255, rgb[2]/255];
	},
	
	drgb: function drgb(rgb) {
		return [rgb[0]*255, rgb[1]*255, rgb[2]*255];
	},
	
	crgb: function crgb(rgb) {
		let A = [0,0,0];
		for (let i = 0; i < 3; i++)
			A[i] = rgb[i] > 255 ? 255 : (rgb[i] < 0 ? 0 : rgb[i]);
		return A;
	},
	
	nhsx: function nhsx(hsx) {
		return [hsx[0], hsx[1]/100, hsx[2]/100];
	},
	
	dhsx: function dhsx(hsx) {
		return [hsx[0], hsx[1]*100, hsx[2]*100];
	},
	
	
	grayscale: function grayscale(rgb) {
		return (0.3*rgb[0] + 0.59*rgb[1] + 0.11*rgb[2]);
	},
	
	
	roundx: function roundx(A, x) {
		const B = [0,0,0];
		const y = 10**x;
		for (let i = 0; i < 3; i++)
			B[i] = Math.round(A[i]*y) / y;
		return B;
	},
	
	
	//*/ conv funcs
	
	rgb2hsv: function rgb2hsv(rgb) {
		let v = rgb[0];
		let j = 0;
		let s = rgb[0];
		
		for (let i = 1; i < 3; i++) {
			if (rgb[i] > v) {
				v = rgb[i];
				j = i;
			}
			else if (rgb[i] < s)
				s = rgb[i];
		}
		
		s = v - s;
		let h = 0;
		
		if (s > 0) {
			const k = j < 3 ? j+1 : 0;
			const i = k < 3 ? k+1 : 0;
			h = 2*j + (rgb[k] - rgb[i]) / s;
			h += h < 0 ? 6 : 0;
			s /= v;
		}
		
		return [60*h, s, v];
	},
	
	hsv2rgb: function hsv2rgb(hsv) {
		let [h, s, v] = hsv;
		h /= 60;
		let rgb = [5, 3, 1];
		for (let i = 0; i < 3; i++) {
			const k = (rgb[i] + h) % 6; // shortcut func from wikipedia
			rgb[i] = v - v*s*Math.max(Math.min(Math.min(k, 4-k), 1), 0);
		}
		return rgb;
	},
	
	
	rgb2hsl: function rgb2hsl(rgb) {
		const hsv = rgb2hsv(rgb);
		let [h, s, l] = hsv;
		
		if (s > 0) {
			s *= l; // undoing the "s /= v" from rgb2hsv func
			l += l - s;
			s /=  Math.min(l, 2-l);
			l /= 2;
		}
		
		return [h, s, l];
	},
	
	hsl2rgb: function hsl2rgb(hsl) {
		let [h, s, l] = hsl;
		h /= 30;
		const a = s*Math.min(l, 1-l);
		const rgb = [0, 8, 4];
		for (let i = 0; i < 3; i++) {
			const k = (rgb[i] + h) % 12; // shortcut func from wikipedia
			rgb[i] = l - a*Math.max(Math.min(Math.min(k-3, 9-k), 1), -1);
		}
		return rgb;
	},
	
	
	// 15 Jan 2023 - seperate linear rgb & rewrite xyz
	
	rgb2linear: function rgb2linear(rgb) {
		const lrgb = [0,0,0];
		for (let i = 0; i < 3; i++) {
			if (rgb[i] > 0.04045)
				lrgb[i] = ((rgb[i]+0.055) / 1.055) ** 2.4;
			else
				lrgb[i] = rgb[i] / 12.92;
		}
		return lrgb;
	},
	
	linear2rgb: function linear2rgb(lrgb) {
		const rgb = [0,0,0];
		for (let i = 0; i < 3; i++) {
			if (lrgb[i] > 0.04045/12.92)
				rgb[i] = lrgb[i]**(5/12) * 1.055 - 0.055;
			else
				rgb[i] = lrgb[i] * 12.92;
		}
		return rgb;
	},
	
	
	lrgb2xyz: function lrgb2xyz(lrgb) {
		const [r,g,b] = lrgb;
		const xyz = [100, 100, 100];
		
		xyz[0] *= r*0.4124564 + g*0.3575761 + b*0.1804375;
		xyz[1] *= r*0.2126729 + g*0.7151522 + b*0.0721750;
		xyz[2] *= r*0.0193339 + g*0.1191920 + b*0.9503041;
		
		return xyz;
	},
	
	xyz2lrgb: function xyz2lrgb(xyz) {
		const [x,y,z] = xyz;
		const lrgb = [1/100, 1/100, 1/100];
		
		lrgb[0] *=  x*3.2404542 - y*1.5371385 - z*0.4985314;
		lrgb[1] *= -x*0.9692660 + y*1.8760108 + z*0.0415560;
		lrgb[2] *=  x*0.0556434 - y*0.2040259 + z*1.0572252;
		
		return lrgb;
	},
	
	
	xyz2lab: function xyz2lab(xyz) {
		const A = [1/95.047, 1/100, 1/108.883];
		for (let i = 0; i < 3; i++) {
			A[i] *= xyz[i];
			if (A[i] > 216/24389)
				A[i] = Math.cbrt(A[i]);
			else
				A[i] = (24389/27*A[i]+16) / 116;
		}
		// TODO: compare performance between variable vs array
		return [
			116*A[1] - 16,
			500*(A[0] - A[1]),
			200*(A[1] - A[2])
		];
	},
	
	lab2xyz: function lab2xyz(lab) {
		const xyz = [0,0,0];
		xyz[1] = (lab[0]+16) / 116;
		xyz[0] = xyz[1] + lab[1]/500;
		xyz[2] = xyz[1] - lab[2]/200;
		
		const cbrt_e = Math.cbrt(216/24389);
		const rw = [95.047, 100, 108.883];
		
		for (let i = 0; i < 3; i++) {
			if (xyz[i] > cbrt_e)
				xyz[i] = xyz[i]**3;
			else
				xyz[i] = (116*xyz[i] - 16) / (24389/27);
			xyz[i] *= rw[i];
		}
		
		return xyz;
	},
	
	// not optimized
	
	xyz2luv: function xyz2luv(xyz) {
		const [x,y,z] = xyz;
		if (x+y+z === 0)
			return [0, 0, 0];
		
		const rw = [95.047, 100, 108.883];
		const _u = 4*rw[0] / (rw[0] + 15*rw[1] + 3*rw[2]);
		const _v = 9*rw[1]*_u / (4*rw[0]);
		
		let u = 4*x / (x + 15*y + 3*z);
		let v = 9*y*u / (4*x);
		
		const _y = y/rw[1];
		const l = _y > 216/24389 ? 116*Math.cbrt(_y) - 16 : 24389/27*_y;
		u = 13*l * (u - _u);
		v = 13*l * (v - _v);
		
		return [l, u, v];
	},
	
	luv2xyz: function luv2xyz(luv) {
		if (luv[0] === 0)
			return [0, 0, 0];
		
		const rw = [95.047, 100, 108.883];
		const _u = 4*rw[0] / (rw[0] + 15*rw[1] + 3*rw[2]);
		const _v = 9*rw[1]*_u / (4*rw[0]);
		
		let [l, u, v] = luv;
		u = _u + u/(13*l);
		v = _v + v/(13*l);
		
		let y = (l > 8) ? ((l+16)/116)**3 : l/_k;
		y *= rw[1];
		const x = y*9*u/(4*v);
		const z = y*(12-3*u-20*v)/(4*v);
		
		return [x, y, z];
	},
	
	
	lab2lch: function lab2lch(lab) {
		const [l,a,b] = lab;
		const c = Math.sqrt(a**2 + b**2);
		let h = Math.atan2(b, a) * 180/Math.PI;
		h += h < 0 ? 360 : 0;
		
		return [l,c,h];
	},
	
	lch2lab: function lch2lab(lch) {
		let [l,c,h] = lch;
		h = h*Math.PI/180;
		const a = c*Math.cos(h);
		const b = c*Math.sin(h);
		
		return [l,a,b];
	},
	
	
	/*
	dist: function dist(col1, col2) {
		const [f,g,h] = col1;
		const [i,j,k] = col2;
		
		return Math.sqrt((i-f)**2 + (j-g)**2 + (k-h)**2);
	},
	
	dist2: function dist2(col1, col2) {
		const [f,g,h] = col1,
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
		
		tmp = 1 - 0.17*cos((_H_ - 30)/deg) + 0.24*cos((2 * _H_)/deg)
			+ 0.32*cos((3 * _H_ + 6)/deg) - 0.2*cos((4 * _H_ - 63)/deg);
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
	*/
	
	
	// new: OKLAB - 05/04/2022
	
	xyz2oklab: function xyz2oklab(xyz) {
		let [x,y,z] = xyz;
		x /= 100;
		y /= 100;
		z /= 100;
		
		// 06/04/2022 - updated matrices from GitHub/LeaVero/color.js
		const l = Math.cbrt(0.8190224432164319  *x + 0.3619062562801221 *y - 0.12887378261216414*z);
		const m = Math.cbrt(0.0329836671980271  *x + 0.9292868468965546 *y + 0.03614466816999844*z);
		const s = Math.cbrt(0.048177199566046255*x + 0.26423952494422764*y + 0.6335478258136937 *z);
		
		return [
			l * 0.2104542553 + m * 0.7936177850 - s * 0.0040720468,
			l * 1.9779984951 - m * 2.4285922050 + s * 0.4505937099,
			l * 0.0259040371 + m * 0.7827717662 - s * 0.8086757660
		];
	},
	
	oklab2xyz: function oklab2xyz(oklab) {
		const [L,a,b] = oklab;
		
		const l = (0.99999999845051981432*L + 0.39633779217376785678 *a + 0.21580375806075880339 *b)**3;
		const m = (1.0000000088817607767 *L - 0.1055613423236563494  *a - 0.063854174771705903402*b)**3;
		const s = (1.0000000546724109177 *L - 0.089484182094965759684*a - 1.2914855378640917399  *b)**3;
		
		return [
			100 * ( 1.2268798733741557 *l - 0.5578149965554813*m + 0.28139105017721583*s),
			100 * (-0.04057576262431372*l + 1.1122868293970594*m - 0.07171106666151701*s),
			100 * (-0.07637294974672142*l - 0.4214933239627914*m + 1.5869240244272418 *s)
		];
	},
	
	
	// oklab with linear rgb - 15 Jan 2023
	
	lrgb2oklab: function lrgb2oklab(lrgb) {
		let [r,g,b] = lrgb;
		const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
		const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
		const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
		
		return [
			0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
			1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
			0.0259040371*l + 0.7827717662*m - 0.8086757660*s
		];
	},
	
	oklab2lrgb: function oklab2lrgb(oklab) {
		const [L,a,b] = oklab;
		
		let l = L + 0.3963377774 * a + 0.2158037573 * b;
		let m = L - 0.1055613458 * a - 0.0638541728 * b;
		let s = L - 0.0894841775 * a - 1.2914855480 * b;
		// TODO: perf test
		l = l*l*l;
		m = m*m*m;
		s = s*s*s;
	
		return [
			 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
		];
	},
	
	
	// chained functions
	
	rgb2oklab: function rgb2oklab(rgb) {
		return lrgb2oklab(rgb2linear(rgb));
	},
	
	oklab2rgb: function oklab2rgb(oklab) {
		return linear2rgb(oklab2lrgb(oklab));
	},
	
	
	rgb2oklch: function rgb2oklch(rgb) {
		return lab2lch(lrgb2oklab(rgb2linear(rgb)));
	},
	
	oklch2rgb: function oklch2rgb(oklch) {
		return linear2rgb(oklab2lrgb(lch2lab(oklch)));
	},
	
	
	// gamut clipping with oklch
	
	maxChroma: function maxChroma(hue, l) {
		if (l < 0 || l > 1) return -1;
		let c0 = 0, c1 = 0.32768;
		let i = 0;
		while (i++ < 15) {
			let c = (c0+c1)/2;
			let rgb = oklab2lrgb(lch2lab([l,c,hue]));
			const [r,g,b] = rgb;
			if (r >= 0 && g >= 0 && b >= 0 &&
				r <= 1 && g <= 1 && b <= 1)
				c0 = c;
			else
				c1 = c;
		}
		
		return c0;
	},
	
	chromaClip: function(rgb) {
		const [r,g,b] = rgb;
		if (r >= 0 && g >= 0 && b >= 0 &&
			r <= 1 && g <= 1 && b <= 1) {
			const A = rgb2oklch(rgb);
			return oklch2rgb([A[0], maxChroma(A[2], A[0]), A[2]]);
		}
		return rgb;
	},
	
	
	/* non gpu funcs
	
	rgb2hex: (rgb) => {
		let hex = "#";
		for (let i = 0; i < 3; i++) {
			let x = round(rgb[i]);
			hex += (x  < 16 ? "0" : "") + x.toString(16);
		}
		return hex;
	},
	
	hex2rgb: (hex) => {
		hex = hex.replace(/#/, "");
		let rgb = [hex.slice(0,2), hex.slice(2,4), hex.slice(4,6)];
		for (let i = 0; i < 3; i++)
			rgb[i] = parseInt(rgb[i], 16);
		return rgb;
	},
	
	
//*/
}


