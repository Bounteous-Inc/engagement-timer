describe('engagement-timer', function() {
  'use strict';

  /*it('Unit: EngagementTimer', function(done) {

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


  it('should count thrice', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [2],
      each: [3],
      startTime: new Date()
    });

    timer.on('interval', function(evt) {

      counter++;

    });

    setTimeout(function() {

      expect(counter).toEqual(3);

      timer.destroy();

      done();

    }, 4500);

  });

  it ('will go idle after 2 seconds', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date()
    });

    timer.on('interval', function(evt) {

      counter++;

    });

    setTimeout(function() {

      expect(counter).toEqual(1);

      timer.destroy();

      done();

    }, 1500);

  });

  it ('will not fire until it reaches the min setting', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [1],
      min: 2,
      startTime: new Date()
    });

    timer.on('interval', function(evt) {

      counter++;

    });

    setTimeout(function() {

      expect(counter).toEqual(2);

      timer.destroy();

      done();

    }, 3500);

  });

  it ('will stop firing when it reaches the max setting', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [1],
      max: 2,
      startTime: new Date()
    });

    timer.on('interval', function(evt) {

      counter++;

    });

    setTimeout(function() {

      expect(counter).toEqual(2);

      timer.destroy();

      done();

    }, 3500);

  });

  it ('will pause while the screen is not active (onVisibilityChange)', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [1],
      idleOnVisibilityChange: true,
      startTime: new Date()
    });
    spyOn(timer, 'start').and.callThrough();
    spyOn(timer, 'pause').and.callThrough();;

    var w = window.open('', '_blank');
    w.close();

    setTimeout(function() {

      expect(timer.start.calls.count()).toEqual(1);
      expect(timer.pause.calls.count()).toEqual(1);
      done();

    }, 1000);

  });*/

  it ('should not restart when idle', function(done) {

    var counter = 0;
    var timer = window.EngagementTimer({
      every: [1],
      idleAfter: 1,
      engagementEvents: ['click'],
      startTime: new Date()
    });

    timer.on('interval', function(evt) {

      counter++;

    });

    setTimeout(function() {

      document.dispatchEvent(new Event('click'));

      setTimeout(function() {

        expect(counter).toEqual(2);
        expect(timer._trackedTime).toEqual(3);
        done();

      }, 1200);

    }, 2400);

  });

});
