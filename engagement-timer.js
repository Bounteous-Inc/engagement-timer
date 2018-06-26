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
 * timer.on('interval', function (evt) {
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
(function (document, window) {
    'use strict';

    window.EngagementTimer = window.EngagementTimer || EngagementTimer;

    /**
     * @name Interval
     * @constructor
     *
     * @param {function} fn
     * @param {number} interval - greater than 1000
     */
    function Interval(fn, interval) {

        this._interval = interval;
        this._fn = fn;

        this.tick();

    }

    Interval.prototype.clear = function () {

        this._cleared = true;

    };

    Interval.prototype.tick = function () {


        setTimeout(function () {

            if (this._cleared) {
                return;
            }

            this._fn();
            this.tick();

        }.bind(this), this._interval);

    };

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
     * @emits EngagementTimer#idle
     */
    function EngagementTimer(opts) {

        if (!opts.each && !opts.every) {
            throw new Error('Requires opts.each or opts.every.');
        }

        if (
            (opts.idleAfter || opts.engagementEvents) &&
            !(opts.idleAfter && opts.engagementEvents && opts.engagementEvents.length)
        ) {
            throw new Error('Configure opts.idleAfter & opts.engagementEvents for idling.');
        }

        if (!(this instanceof EngagementTimer)) {
            return new EngagementTimer(opts);
        }

        this._context = opts.context || document;

        if (typeof this._context === 'string') {
            this._context = document.querySelector(opts.context);
        }
        if (!this._context) {
            throw new Error('Unable to find context ' + opts.context);
        }

        this._max = opts.max * 1000 || Infinity;
        this._min = opts.min * 1000 || 0;
        this._every = (opts.every || []).map(function (n) {

            return opts.min ? (opts.min % n) + n : 0;

        });
        this._every.initialValues = cleanMarks(opts.every || []);
        this._each = cleanMarks(opts.each || []);
        this._each.initialValues = this._each.slice(0);

        this._minInterval = 1000 * setGCD(this._every.initialValues.concat(this._each.initialValues));
        this._idleAfter = opts.idleAfter * 1000 + 1 || null;
        this._lastTick = opts.startTime;
        this._trackedTime = this._lastTick ? +new Date - this._lastTick : 0;

        this._tickElapsed = 0;
        this._running = false;
        this._offset = 0;
        this._events = {};
        this._cache = {};

        var throttledRestart = throttle(function () {

            if (!this._running) {
                this.start();
            }

            this._resetIdleTimeout();

        }.bind(this), this._idleTimeout / 2);
        var boundHandler = function (evt) {

            this._context.addEventListener(evt, throttledRestart);

        }.bind(this);
        var pausedOnHide;

        if (opts.engagementEvents) {
            opts.engagementEvents.forEach(boundHandler);
        }

        if (opts.idleOnVisibilityChange) {

            onVisibilityChange(function (isHidden) {

                if (isHidden && this._running) {

                    this.pause();
                    pausedOnHide = true;

                } else if (!isHidden && !this._running && pausedOnHide) {

                    this.start();

                }

            }.bind(this));

        }

        if (this._trackedTime) {
            setTimeout(this._tick.bind(this), 0);
        }

    }

    EngagementTimer.prototype._startTimer = function () {

        this._Interval = new Interval(function () {

            this._tick();
            this._Interval.clear();
            this._Interval = new Interval(this._tick.bind(this), this._minInterval);
            this._tickElapsed = 0;

        }.bind(this), Math.min(this._minInterval - this._tickElapsed, this._minInterval));

    };

    EngagementTimer.prototype._tick = function () {

        var d = +new Date;

        this._trackedTime += d - this._lastTick;
        this._lastTick = d;

        if (this._trackedTime < this._min) {
            return;
        }
        if (this._trackedTime > this._max) {
            this.destroy();
            return;
        }

        this._checkMarks();

    };

    /**
     * @param {string} evt
     * @param {function} handler
     */
    EngagementTimer.prototype.on = function (evt, handler) {

        if (!this._events[evt]) {
            this._events[evt] = [];
        }

        this._events[evt].push(handler);

    };

    EngagementTimer.prototype.reset = function () {

        this._each = this._each.initialValues.slice(0);
        this._every = this._every.initialValues.slice(0);
        this._lastTick = +new Date;
        this._tickRemainder = 0;
        this._trackedTime = 0;
        this._cache = {};

        this.emit('reset', {
            data: {
                timestamp: +new Date
            }
        });

    };

    EngagementTimer.prototype.start = function () {

        var d = +new Date;

        if (this._running) {
            return;
        }

        if (!this._idleTimer && this._idleAfter) {
            this._resetIdleTimeout();
        }

        this._running = true;
        this._startTimer();
        this._lastTick = d - this._tickElapsed;

        this.emit('start', {
            data: {
                timestamp: d
            }
        });

    };

    EngagementTimer.prototype.pause = function () {

        var d = +new Date;

        this._tickElapsed = d - this._lastTick;
        this._trackedTime += this._tickElapsed;

        if (this._Interval) {
            this._Interval.clear();
        }

        clearTimeout(this._idleTimer);

        this._running = false;

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
    EngagementTimer.prototype.emit = function (name, data) {

        var handlers = this._events[name];

        if (!handlers) return;

        this._events[name].forEach(function (handler) {

            setTimeout(function () {

                handler(data);

            }, 0);

        });

    };

    /**
     * Cleans up after itself
     */
    EngagementTimer.prototype.destroy = function () {

        if (this._Interval) {
            this._Interval.clear();
        }

        clearTimeout(this._idleTimeout);

    };

    /**
     * Checks the time elapsed and which times have been tracked
     */
    EngagementTimer.prototype._checkMarks = function () {

        var curr = Math.floor(this._trackedTime / 1000);
        var toCall = [];
        var i = 0;
        var intervals;
        var memo;
        var j;
        var n;

        while (this._each.length) {

            n = this._each.shift();

            if (n > curr) {
                this._each.unshift(n);
                break;
            }

            toCall.push(n);

        }

        while (i < this._every.length) {

            n = this._every.initialValues[i];
            memo = this._every[i];
            j = 0;

            i += 1;

            if (memo <= curr) {

                intervals = Math.floor((curr - memo) / n);

                while (j < intervals) {
                    j += 1;
                    toCall.push(n * j + memo);
                }

                this._every[i - 1] = n * j;

            }

        }

        toCall.sort(ascendingSort).forEach(this._checkMark.bind(this));

    };

    /**
     * @param {number} mark
     */
    EngagementTimer.prototype._checkMark = function (mark) {

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
     * Resets the timeout for the idle counter
     */
    EngagementTimer.prototype._resetIdleTimeout = function () {

        clearTimeout(this._idleTimer);

        this._idleTimer = setTimeout(function () {

            this.pause();
            this.emit('idle', {
                data: {
                    timestamp: +new Date
                }
            });
            this._idleTimer = null;

        }.bind(this), this._idleAfter);

    };

    /**
     * .sort() callback
     *
     * @param {number} a
     * @param {number} b
     *
     * @return {number}
     */
    function ascendingSort(a, b) {

        if (a > b) return 1;
        if (b > a) return -1;
        return 0;

    }

    /**
     * Reduces and casts to number
     * @param {*[]} configs
     *
     * @return {number[]}
     */
    function cleanMarks(arr) {

        return arr.reduce(function (prev, curr) {

            var n = Number(curr);

            if (n) {
                prev.push(n);
            }

            return prev;

        }, []).sort(ascendingSort);

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

        return set.reduce(function (prev, curr) {

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

            document.addEventListener(visibilityChange, function () {

                handler(document[hidden]);

            });

        } else {

            window.addEventListener('blur', function () {

                handler(true);

            });

            window.addEventListener('focus', function () {

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
        var later = function () {
            previous = new Date;
            timeout = null;
            result = func.apply(context, args);
        };
        return function () {
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
 * v2.1.1
 * Created by the Google Analytics consultants at http://www.lunametrics.com/
 * Written by @notdanwilkerson
 * Documentation: https://www.lunametrics.com/labs/recipes/engagement-timer/
 * Licensed under the MIT License
 */