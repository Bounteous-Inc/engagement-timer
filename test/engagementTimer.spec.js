describe('engagement-timer', function() {
  'use strict';

	var sandbox = sinon.createSandbox();
	var clock;
	var cb;

  beforeEach(function(done) {

    var html = '<div class="spacer" style="height: 1000px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div id="each" style="height: 100px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div class="every" style="height: 200px; width: 100%;"></div>' +
      '<div style="height: 200px; overflow: auto" class="nested">' +
      '  <div class="nested-every" style="height: 200px; width: 100%;">1</div>' +
      '  <div class="nested-every" style="height: 200px; width: 100%;">2</div>' +
      '</div>';

    document.body.innerHTML = html;

		clock = sinon.useFakeTimers();
		cb = sinon.spy();

    done();

  });

	afterEach(function() { sandbox.restore(); });

  it('Unit: EngagementTimer', function(done) {

    expect(window.EngagementTimer).toBeDefined();

    var timer = window.EngagementTimer({
      each: [5 * 60, 10*60],
      every: [12],
      startTime: new Date(),
      idleAfter: 5,
      engagementEvents: ['click', 'mousedown', 'touchstart', 'keydown', 'scroll'],
      idleOnVisibilityChange: true,
      max: 60 * 15,
      min: 10
    });

    expect(timer.on).toEqual(jasmine.any(Function));
    expect(timer.start).toEqual(jasmine.any(Function));
    expect(timer.pause).toEqual(jasmine.any(Function));
    expect(timer.reset).toEqual(jasmine.any(Function));
    expect(timer.destroy).toEqual(jasmine.any(Function));

    timer.destroy();

    done();

  });

  it('should track time', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [2],
      each: [3],
      startTime: new Date()
    });
		timer.start();

    timer.on('interval', cb);
		
		clock.tick(4001);

		expect(cb.callCount).toEqual(3);

		timer.destroy();

		done();

  });

  it('should go idle', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date()
    });
		timer.start();

    timer.on('interval', cb); 

		clock.tick(2001);

		expect(cb.callCount).toEqual(1);

		timer.destroy();

		done();

  });

  it ('should not fire until trackedTime > opts.min', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      min: 2,
      startTime: new Date()
    });
		timer.start();

    timer.on('interval', cb);

		clock.tick(3001);

		expect(cb.callCount).toEqual(2);

		timer.destroy();

		done();

  });

  it ('should stop firing after trackedTime > opts.max', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      max: 2,
      startTime: new Date()
    });
		timer.start();
    timer.on('interval', cb);

		clock.tick(3001);

		expect(cb.callCount).toEqual(2);

		timer.destroy();

		done();

  });

  it ('should go idle when document.hidden == true', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      idleOnVisibilityChange: true,
      startTime: new Date()
    });
		timer.start();

		sinon.spy(timer, 'start');
		sinon.spy(timer, 'pause');

		var docHidden = sandbox.stub(document, 'hidden');

		docHidden.value(true);
		document.dispatchEvent(new Event('visibilitychange'));

		docHidden.value(false);
		document.dispatchEvent(new Event('visibilitychange'));

		clock.tick(1);

		expect(timer.start.callCount).toEqual(1);
		expect(timer.pause.callCount).toEqual(1);

		done();

  });

  it ('should go idle on window.blur if document.hidden doesn\'t exist', function(done) {

		sandbox.stub(document, 'hidden').value(undefined);
		sandbox.stub(document, 'webkitHidden').value(undefined);

    var timer = window.EngagementTimer({
      every: [1],
      idleOnVisibilityChange: true,
      startTime: new Date()
    });
		timer.start();

		sinon.spy(timer, 'start');
		sinon.spy(timer, 'pause');

		window.dispatchEvent(new Event('blur'));
		window.dispatchEvent(new Event('focus'));

		clock.tick(1);

		expect(timer.start.callCount).toEqual(1);
		expect(timer.pause.callCount).toEqual(1);

		done();

  });


  it ('should not restart when idle', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date()
    });
		var idleCb = sinon.spy();

		timer.start();

    timer.on('interval', cb);
		timer.on('idle', idleCb);
 
		clock.tick(1002);

		expect(cb.callCount).toEqual(1);
		expect(idleCb.callCount).toEqual(1);

		clock.tick(1001);

		expect(cb.callCount).toEqual(1);
		expect(timer._running).toEqual(false);

		document.dispatchEvent(new Event('click'));

		clock.tick(1001);

		expect(cb.callCount).toEqual(2);
		expect(timer._trackedTime).toEqual(2003);

		done();

  });

	it ('should ignore events in other contexts', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date(),
			context: '.nested'
    });
		var i;

		timer.on('interval', cb);	

		document.querySelector('.every').dispatchEvent(new Event('click'));

		clock.tick(1001);
	
		expect(timer._trackedTime).toEqual(0);
		expect(cb.callCount).toEqual(0);
		expect(timer._running).toEqual(false);
		
		done();

	});

	it ('should start when an event occurs in a context', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date(),
			context: '.nested'
    });
		var i;

		timer.on('interval', cb);	
	
		document.querySelector('.nested').dispatchEvent(new Event('click'));

		clock.tick(1001);

		expect(timer._trackedTime).toEqual(1001);
		expect(cb.callCount).toEqual(1);
		expect(timer._running).toEqual(false);

		done();

	});

	it ('should set the lastTick back when restarting', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      startTime: new Date(),
			context: '.nested'
    });
		timer.start();

		clock.tick(1501);

		timer.pause();

		expect(timer._trackedTime).toEqual(1501);
		expect(timer._tickElapsed).toEqual(501);
		clock.tick(1);
	
		done();		

	});

	it ('should reset the timer', function(done) {

    var timer = window.EngagementTimer({
      every: [1],
      startTime: new Date(),
			context: '.nested'
    });
		timer.start();
		clock.tick(1000);
		timer.reset();

		expect(timer._trackedTime).toEqual(0);
	
		done();		

	});

});
