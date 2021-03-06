define(["Tone/core/Tone", "Tone/effect/Effect", "Tone/signal/WaveShaper"], function(Tone){

	"use strict";

	/**
	 *  @class A Chebyshev waveshaper. Good for making different types of distortion sounds.
	 *         Note that odd orders sound very different from even ones. order = 1 is no change. 
	 *         http://music.columbia.edu/cmc/musicandcomputers/chapter4/04_06.php
	 *
	 *  @extends {Tone.Effect}
	 *  @constructor
	 *  @param {number} order The order of the chebyshev polynomial. Normal range between 1-100. 
	 *  @example
	 *  var cheby = new Tone.Chebyshev(50);
	 */
	Tone.Chebyshev = function(){

		var options = this.optionsObject(arguments, ["order"], Tone.Chebyshev.defaults);
		Tone.Effect.call(this);

		/**
		 *  @type {WaveShaperNode}
		 *  @private
		 */
		this._shaper = new Tone.WaveShaper(4096);

		/**
		 * holds onto the order of the filter
		 * @type {number}
		 * @private
		 */
		this._order = options.order;

		this.connectEffect(this._shaper);
		this.order = options.order;
		this.oversample = options.oversample;
	};

	Tone.extend(Tone.Chebyshev, Tone.Effect);

	/**
	 *  @static
	 *  @const
	 *  @type {Object}
	 */
	Tone.Chebyshev.defaults = {
		"order" : 1,
		"oversample" : "none"
	};

	/**
	 *  get the coefficient for that degree
	 *  @param {number} x the x value
	 *  @param   {number} degree 
	 *  @param {Object} memo memoize the computed value. 
	 *                       this speeds up computation greatly. 
	 *  @return  {number}       the coefficient 
	 *  @private
	 */
	Tone.Chebyshev.prototype._getCoefficient = function(x, degree, memo){
		if (memo.hasOwnProperty(degree)){
			return memo[degree];
		} else if (degree === 0){
			memo[degree] = 0;
		} else if (degree === 1){
			memo[degree] = x;
		} else {
			memo[degree] = 2 * x * this._getCoefficient(x, degree - 1, memo) - this._getCoefficient(x, degree - 2, memo);
		}
		return memo[degree];
	};

	/**
	 * The order of the Chebyshev polynomial i.e.
	 * order = 2 -> 2x^2 + 1. order = 3 -> 4x^3 + 3x. 
	 * @memberOf Tone.Chebyshev#
	 * @type {number}
	 * @name order
	 */
	Object.defineProperty(Tone.Chebyshev.prototype, "order", {
		get : function(){
			return this._order;
		},
		set : function(order){
			this._order = order;
			var curve = new Array(4096);
			var len = curve.length;
			for (var i = 0; i < len; ++i) {
				var x = i * 2 / len - 1;
				if (x === 0){
					//should output 0 when input is 0
					curve[i] = 0;
				} else {
					curve[i] = this._getCoefficient(x, order, {});
				}
			}
			this._shaper.curve = curve;
		} 
	});

	/**
	 * The oversampling of the effect. Can either be "none", "2x" or "4x".
	 * @memberOf Tone.Chebyshev#
	 * @type {string}
	 * @name oversample
	 */
	Object.defineProperty(Tone.Chebyshev.prototype, "oversample", {
		get : function(){
			return this._shaper.oversample;
		},
		set : function(oversampling){
			this._shaper.oversample = oversampling;
		} 
	});

	/**
	 *  clean up
	 *  @returns {Tone.Chebyshev} `this`
	 */
	Tone.Chebyshev.prototype.dispose = function(){
		Tone.Effect.prototype.dispose.call(this);
		this._shaper.dispose();
		this._shaper = null;
		return this;
	};

	return Tone.Chebyshev;
});