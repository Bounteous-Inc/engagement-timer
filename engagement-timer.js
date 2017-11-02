/**
 * Engagement Timer
 *
 * Measure time interacting with a given context. Pair with a visibility tracker
 * for scroll-aware tracking.
 *
 * @example
 * ```javascript
 * var timer = EngagementTimer({
 *   each: [5 * 60, 10*60],
 *   every: [12],
 *   context: '#content',
 *   idleAfter: 5,
 *   engagementEvents: ['click', 'mousedown', 'touchstart', 'keydown', 'scroll'],
 *   startTime: +new Date,
 *   idleOnVisibilityChange: true,
 *   max: 60 * 15,
 *   min: 10
 * });
 *
 * timer.on('interval', function(evt) {
 *
 *   notifySomeService(evt.data.time);
 *
 * });
 * ```
 *
 * Tested on:
 * - Internet Explorer 9+
 * - Edge 16
 * - Chrome 62
 * - Firefox 56
 * - Opera 48
 * - Safari 11
 */
(function(document, window) {
	'use strict';

  var startTime = +new Date;

  window.EngagementTimer = window.EngagementTimer || EngagementTimer;

  /**
   * Builds Interval objects
   *
   * @returns {Interval}
   */
  var IntervalFactory = (function() {

    var intervalMap = {};
    var id = 1;

    /**
		 * @name Interval
     * @constructor
     *
     * @param {function} fn
     * @param {number} interval - greater than 1000
		 * @param {number} offset - initial timeout
     */
    function Interval(fn, interval, offset) {

      if (interval < 1000) throw new Error('Interval is too frequent.');

      var tid = this.tickId = (id++);

			if (offset) {

				intervalMap[tid] = setTimeout(function() {

					fn();
					tick(fn, interval, tid);

				}.bind(this), offset);

			} else {

      	tick(fn, interval, this.tickId);

			}

    }

    Interval.prototype.clear = function() {

      clearTimeout(intervalMap[this.tickId]);

    };

    function tick(fn, interval, id) {

      intervalMap[id] = setTimeout(function() {

        fn();
        tick(fn, interval, id);

      }, interval);

    }

    return Interval;

  })();
  /**
   * @name EngagementTimer
   * Constructor for engagement timer
   *
   * @constructor
   *
   * @param opts {object} optsurations for timer
   * @param opts.each {number[]} specific times to emit an event at, e.g. 4, 15
   * @param opts.every {number[]} multiples to emit events every n seconds
   * @param [opts.idleAfter] {number} number of seconds to wait before going idle and tracking pauses
   * @param [opts.min] {number} minimum time in seconds before beginning to track events
   * @param [opts.max] {number} maximum time in seconds to track events
   * @param [opts.engagementEvents] {string[]} events to bind to that prevent idling
   * @param [opts.idleOnVisibilityChange] {boolean} pause the timer when the tab is not visible
   * @param [opts.startTime] {number} starting time to use when calculating time passed (defaults to when script runs or domInteractive timing)
   * @param [opts.context] {HTMLElement|string} DOM element (or selector) to listen for engagementEvents on (defaults to document)
	 *
	 * @emits EngagementTimer#interval
	 * @emits EngagementTimer#reset
	 * @emits EngagementTimer#start
	 * @emits EngagementTimer#pause
	 */
  function EngagementTimer(opts) {

		if (!opts.each && !opts.every) throw new Error('Requires opts.each or opts.every.');

		if (
			(opts.idleAfter || opts.engagementEvents) &&
			!(opts.idleAfter && opts.engagementEvents && opts.engagementEvents.length)
		) {

			throw new Error('Configure opts.idleAfter & opts.engagementEvents for idling.');

		}

		if (!(this instanceof EngagementTimer)) return new EngagementTimer(opts);

		var context = opts.context || document;
		var throttledIdle;

		if (typeof context === 'string') context = document.querySelector(opts.context);
		if (!context) throw new Error('Unable to find context ' + opts.context);

    this._context = context;
    this._startTime = opts.startTime || startTime;
    this._trackedTime = Math.ceil((+new Date - this._startTime) / 1000);
    this._max = opts.max || Infinity;
    this._min = opts.min || 0;
    this._every = opts.every || [];
    this._each = opts.each || [];
		this._gcd = setGCD(this._every.concat(this._each));
    this._each._originals = this._each.slice(0);
    this._every._originals = this._every.slice(0);
		this._events = {};
    this._cache = {};
		this._lastTick = this._startTime;

		setTimeout(this.start.bind(this), 0);

		if (opts.idleAfter && opts.engagementEvents) {

			this._idleAfter = opts.idleAfter * 1000 + 100;
	    this._idleTimer = this._resetIdleTimeout();

			throttledIdle = throttle(this._preventIdle.bind(this), this._idleTimeout / 2);

	    opts.engagementEvents.forEach(function(engagementEvent) {

	      this._context.addEventListener(engagementEvent, throttledIdle);

	    }.bind(this));

		}


    if (opts.idleOnVisibilityChange) {

      onVisibilityChange(function(isHidden) {

        isHidden ? this.pause() : this.start();

      }.bind(this));

    }

  }

	/**
	 * Starts an timer which counts the number of intervals since starting
	 *
	 * @param {number} [offset] - initial offset
	 */
  EngagementTimer.prototype._timer = function(offset) {

    return new IntervalFactory(function() {

			var d = +new Date;

			this._trackedTime += Math.floor((d - this._lastTick) / 1000);
			this._lastTick = d;

    	if (this._trackedTime < this._min) return;
			if (this._trackedTime > this._max) return this.destroy();

			this._checkMarks();

    }.bind(this), this._gcd * 1000, offset);

  };

  /**
   * Registers an event listener
   *
   * @param {string} evt
   * @param {function} handler
   */
  EngagementTimer.prototype.on = function(evt, handler) {

    (this._events[evt] = this._events[evt] || []).push(handler);

  };

  /**
   * Resets the timer
   */
  EngagementTimer.prototype.reset = function() {

		this._each = this._each._originals.slice(0);
		this._every = this._every._originals.slice(0);
    this._trackedTime = 0;
		this._startTime = +new Date;
		this._cache = {};

    this.emit('reset', {
      data: {
        timestamp: +new Date()
      }
    });

  };

  /**
   * Starts the timer
   */
  EngagementTimer.prototype.start = function() {

		console.log(this._offset);
    if (!this._tick) this._tick = this._timer(this._offset);

    this.emit('start', {
      data: {
        timestamp: +new Date
      }
    });

  };

  /**
   * Pauses the timer
   */
  EngagementTimer.prototype.pause = function() {

		var d = +new Date;

		this._offset = Math.floor((d - this._lastTick) / 1000);

    if (this._tick) this._tick.clear();

    this._tick = null;
		this._running = 0;

    this.emit('pause', {
      data: {
        timestamp: +new Date
      }
    });

  };

  /**
   * Emits events to registered handlers
   *
   * @param {string} name
   * @param {object} data
   */
  EngagementTimer.prototype.emit = function(name, data) {

		var handlers = this._events[name];

		if (!handlers) return;

    this._events[name].forEach(function(handler) {

      setTimeout(function() {

        handler(data);

      }, 0);

    });

  };

  /**
   * Cleans up after itself
   */
  EngagementTimer.prototype.destroy = function() {

  	if (this._tick) this._tick.clear();

  };

  /**
   * Checks the time elapsed and which times have been tracked
   */
  EngagementTimer.prototype._checkMarks = function() {

    var curr = this._trackedTime;
    var q = [];

    loopAndCall(this._each, greaterThanCurr, checkMarksEachCb.bind(this));
    loopAndCall(this._every, greaterThanCurr, checkMarksEveryCb.bind(this));

    q.sort(numberSort).forEach(this._checkMark.bind(this));

		/**
		 * @param {number} mark
		 *
		 * @returns {boolean}
		 */
    function greaterThanCurr(mark) {

      return curr >= mark;

    }

		/**
		 * @param {number} mark
		 * @param {number} index
		 * @param {Array} arr
		 *
		 * @returns {boolean}
		 */
    function checkMarksEveryCb(mark, index, arr) {
			/* jshint validthis: true */

      var orig = this._every._originals[index];

      q.push(mark);
      arr[index] = ((mark / orig) + 1) * orig;

    }

		/**
		 * @param {number} mark
		 * @param {number} index
		 *
		 * @returns {boolean}
		 */
    function checkMarksEachCb(mark, index) {
			/* jshint validthis: true */

      q = q.concat(this._each.slice(index, 1));

    }

  };

  /**
   * @param {number} mark
   */
  EngagementTimer.prototype._checkMark = function(mark) {

    if (!this._cache[mark]) {

      this._cache[mark] = true;
      this.emit('interval', {
        data: {
          time: mark
        }
      });

    }

  };

	/**
	 * Resets the idle timeout
	 */
  EngagementTimer.prototype._preventIdle = function() {

		if (!this._tick) this.start();

    clearTimeout(this._idleTimer);
    this._idleTimer = this._resetIdleTimeout();

  };

  /**
   * Resets the timeout for the idle counter
   */
  EngagementTimer.prototype._resetIdleTimeout = function() {

    return setTimeout(function() {

      this.pause();

    }.bind(this), this._idleAfter);

  };

	/**
	 * Loops through the array, applies the predicate, calls callback when true
	 *
	 * @param {Array} arr
	 * @param {function} predicate
	 * @param {function} cb
	 */
  function loopAndCall(arr, predicate, cb) {

    var i;

    for (i = arr.length - 1; i >= 0; i--) {

      if (predicate(arr[i])) {

        cb(arr[i], i, arr);

      }

    }

  }

	/**
	 * .sort() callback
	 *
	 * @param {number} a
	 * @param {number} b
	 *
	 * @return {number}
	 */
  function numberSort(a, b) {

    if (a > b) return 1;
    if (b > a) return -1;
    return 0;

  }

  /**
   * Euclid GCD
   *
   * @param {number} a
   * @param {number} b
   *
   * @returns {number}
   *
   *
   */
  function GCD(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    if (b > a) return GCD(b, a);

    while (true) {
      if (b === 0) return a;
      a %= b;
      if (a === 0) return b;
      b %= a;
    }

  }
  /**
   * Euclid GCD on a set
   *
   * @param {number[]} set
   *
   * @returns {number}
   */
  function setGCD(set) {

		if (set.length === 1) return set[0];

    var gcd = set.pop();

    return set.reduce(function(prev, curr) {

      return GCD(prev, curr);

    }, gcd);

  }

  /**
   * @param {*} thing
   *
   * @returns {boolean}
   */
  function isDefined(thing) {

    return typeof thing !== 'undefined';

  }

  /**
   * @param {visibilityChangeHander} handler
   */
  /**
   * @callback visibilityChangeHandler
	 * @private
   *
   * @param {bool} isHidden
   */
  function onVisibilityChange(handler) {

    var visibilityChange,
      	hidden;

    if (isDefined(document.hidden)) {

      hidden = "hidden";
      visibilityChange = "visibilitychange";

    } else if (isDefined(document.mozHidden)) {

      hidden = "mozHidden";
      visibilityChange = "mozvisibilitychange";

    } else if (isDefined(document.msHidden)) {

      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";

    } else if (isDefined(document.webkitHidden)) {

      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";

    }

    if (visibilityChange) {

      document.addEventListener(visibilityChange, function() {

        handler(document[hidden]);

      });

    } else {

      window.addEventListener('blur', function() {

        handler(true);

      });

      window.addEventListener('focus', function() {

        handler(false);

      });

    }

  }

  /*
   * Throttle function borrowed from:
   * Underscore.js 1.5.2
   * http://underscorejs.org
   * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Underscore may be freely distributed under the MIT license.
   */
  function throttle(func, wait) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }

})(document, window);
/*
 * v2.0.0
 * Created by the Google Analytics consultants at http://www.lunametrics.com/
 * Written by @notdanwilkerson
 * Documentation: https://www.lunametrics.com/labs/recipes/engagement-timer/
 * Licensed under the MIT License
 */