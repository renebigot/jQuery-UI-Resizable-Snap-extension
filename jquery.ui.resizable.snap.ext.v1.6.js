/**
 * "jQuery UI Resizable Snap" - Extension to the jQuery UI Resizable plugin for snapping while resizing.
 *
 * @copyright       Copyright 2011, Alexander Polomoshnov
 * @license         MIT license (https://raw.github.com/polomoshnov/jQuery-UI-Resizable-Snap-extension/master/LICENSE.txt)
 * @link            https://github.com/polomoshnov/jQuery-UI-Resizable-Snap-extension
 * @version         1.6
 */
(function ($) {
	$.extend($.ui.resizable.prototype.options, { snapTolerance: 20, snapMode: 'both' });
	
	$.ui.plugin.add('resizable', 'snap', {
		start: function () {
			var $this = $(this), inst = $this.data('resizable'), snap = inst.options.snap;
			inst.ow = inst.helper.outerWidth() - inst.size.width;
			inst.oh = inst.helper.outerHeight() - inst.size.height;
			inst.lm = getLm($this);
			inst.tm = getTm($this);
			inst.coords = [];
			
			$(typeof snap == 'string' ? snap : ':data(resizable)').each(function () {
				if (this == inst.element[0] || this == inst.helper[0]) return;
			
				var $el = $(this), p = $el.position(), 
					l = p.left + getLm($el), t = p.top + getTm($el);
					
				inst.coords.push({ 
					l: l, t: t, 
					r: l + $el.outerWidth(), b: t + $el.outerHeight() });
			});
		},
		resize: function () {
			var ls = [], ts = [], ws = [], hs = [],
				inst = $(this).data('resizable'),
				axises = inst.axis.split(''),
				st = inst.options.snapTolerance,
				md = inst.options.snapMode,
				l = inst.position.left + inst.lm, _l = l - st,
				t = inst.position.top + inst.tm, _t = t - st,
				r = l + inst.size.width + inst.ow, _r = r + st,
				b = t + inst.size.height + inst.oh, _b = b + st;
				
			$.each(inst.coords, function () {
				var w = Math.min(_r, this.r) - Math.max(_l, this.l),
					h = Math.min(_b, this.b) - Math.max(_t, this.t);
					
				if (w < 0 || h < 0) return;
				
				for (var i = 0; i < axises.length; i++) {
					if (md == 'outer') {
						switch (axises[i]) {
							case 'w': case 'e': if (w > st * 2) return; break;
							case 'n': case 's': if (h > st * 2) return;
						}
					} else if (md == 'inner') {
						switch (axises[i]) {
							case 'w': case 'e': if (w < st * 2) return; break;
							case 'n': case 's': if (h < st * 2) return;
						}
					}
					
					switch (axises[i]) {
						case 'w': ls.push(getC(l - this.l, l - this.r, st)); break;
						case 'n': ts.push(getC(t - this.t, t - this.b, st)); break;
						case 'e': ws.push(getC(r - this.l, r - this.r, st)); break;
						case 's': hs.push(getC(b - this.t, b - this.b, st));
					}
				}
			});
			
			if (hs.length) inst.size.height += getN(hs);
			if (ws.length) inst.size.width += getN(ws);
			if (ls.length) {
				var n = getN(ls);
				inst.position.left += n;
				inst.size.width -= n;
			} 
			if (ts.length) {
				var n = getN(ts);
				inst.position.top += n;
				inst.size.height -= n;
			}
		}
	});
	
	function getC(lt, rb, st) {
		return Math.abs(lt) < st ? -lt : Math.abs(rb) < st ? -rb : 0;
	}
		
	function getN(ar) {
		return ar.sort(function (a, b) { return !a ? 1 : !b ? -1 : Math.abs(a) - Math.abs(b) })[0];
	}
	
	function getLm($el) {
		return parseInt($el.css('margin-left'), 10) || 0;
	}
	
	function getTm($el) {
		return parseInt($el.css('margin-top'), 10) || 0;
	}
	
	// These are patches to the jQuery resizable plugin.
	// TODO: Write my own resizable plugin instead of messing around with the badly designed and broken native one.
	function patch(func, afterFunc, beforeFunc) {
		var fn = $.ui.resizable.prototype[func];
		$.ui.resizable.prototype[func] = function () {
			if (beforeFunc) beforeFunc.apply(this, arguments);
			fn.apply(this, arguments);
			if (afterFunc) afterFunc.apply(this, arguments);
		}
	}
	
	patch('_mouseStop', null, function () {
		if (this._helper) {
			this.position = { left: parseInt(this.helper.css('left'), 10), top: parseInt(this.helper.css('top'), 10) };
			this.size = { width: this.helper.outerWidth(), height: this.helper.outerHeight() };
		}
	});
	
	patch('_mouseStart', function () {
		if (this._helper) {
			this.size = { 
				width: this.size.width - (this.helper.outerWidth() - this.helper.width()), 
				height: this.size.height - (this.helper.outerHeight() - this.helper.height()) 
			};
			this.originalSize = { width: this.size.width, height: this.size.height };
		}
	});
	
	patch('_renderProxy', function () {
		if (this._helper) {
			this.helper.css({
				left: this.elementOffset.left,
				top: this.elementOffset.top,
				width: this.element.outerWidth(),
				height: this.element.outerHeight()
			});
		}	
	});
	
	var p = $.ui.resizable.prototype.plugins.resize;
	$.each(p, function (k, v) {
		if (v[0] == 'ghost') {
			p.splice(k, 1);
			return false;
		}
	});
	
	$.each($.ui.resizable.prototype.plugins.start, function (k, v) {
		if (v[0] == 'ghost') {
			var fn = v[1];
			v[1] = function () {
				fn.apply(this, arguments);
				$(this).data('resizable').ghost.css({ width: '100%', height: '100%' });
			}
			return false;
		}
	});
})(jQuery);