# Engagement Timer

Library for observing page engagement. Register handlers to fire when a specified number of seconds of engaged time have passed or every `n` seconds. Can optionally go "idle" when a user stops engaging with the page or switches tabs and target a specific page element. Tested on:

- Internet Explorer 9+
- Edge 16
- Chrome 62
- Firefox 56
- Opera 48
- Safari 11

To get started, install the script in your project and set up a tracker.

```javascript
var timer = EngagementTimer({
  every: [10]
});
```

The example timer will emit `interval` events every 10 seconds. To register a handler on these events, call the `EngagementTimer#on` method.

```javascript
timer.on('interval', function(evt) {

  // Passes the number of seconds for the interval to the service
  notifySomeService(evt.data.time);

});
```

When a timer is no longer required it can be destroyed by calling `.destroy()`.

```javascript
timer.destroy();
```

# Google Tag Manager Plugin

A pre-built Google Tag Manager container is included in the repository for download to import tracking into Google Tag Manager. The file is named luna-engagement-timer.json.

## Installation & Documentation

For installation instructions and complete documentation, visit [http://www.lunametrics.com/labs/recipes/engagement-timer/#documentation](http://www.lunametrics.com/labs/recipes/engagement-timer/#documentation).

## License

Licensed under the MIT License. For the full text of the license, view the LICENSE.MD file included with this repository.

## Acknowledgements

Created by the honest folks at [LunaMetrics](http://www.lunametrics.com/), a digital marketing & Google Analytics consultancy. For questions, please drop us a line here or [on our blog](http://www.lunametrics.com/blog/).

Written by [Dan Wilkerson](https://twitter.com/notdanwilkerson).
