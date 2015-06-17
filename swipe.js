/*!
 * infinite-swipe v0.1.1
 * https://github.com/mctenshi/infinite-swipe
 *
 * infinite swipe is fork of https://github.com/mctenshi/recopick-swipe
 * Released under the MIT license
 */
(function (factory) {
  "use strict";

  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  "use strict";

  var isTransformSupported = (function () {
    var testEl = document.createElement('div'),
      transformPrefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' '),
      transitionPrefixes = 'transition WebkitTransition MozTransition OTransition msTransition'.split(' ');
    for (var i = 0; i < transformPrefixes.length; i++) {
      if (testEl.style[transformPrefixes[i]] !== undefined &&
          testEl.style[transitionPrefixes[i]] !== undefined) {
        return true;
      }
    }
    return false;
  }());


  var swipe = function (options) {
    options = $.extend({
          $target: null,
          $prev: null,
          $next: null,
          $curr: null,
          total: 1,
          infinite: false,
          transition_ms: 300
        }, options);

    var $el = $(this),
        $target = options.$target || $el,
        p = 1, offset = 0, total = options.total,
        curr_px = 0, t, disabled_touch = false;

    $el.addClass('infinite-swipe-stage');
    $target.addClass('infinite-swipe-target').css({
      '-webkit-transition-delay': options.transition_ms,
      '-moz-transition-delay': options.transition_ms,
      '-ms-transition-delay': options.transition_ms,
      '-o-transition-delay': options.transition_ms,
      'transition-delay': options.transition_ms
    });

    if (options.infinite) {
      $target.clone().attr('aria-hidden', true)
             .addClass('infinite-swipe-target-clone')
             .css('left', options.total * 100 + '%')
             .insertBefore($target);
      $target = $target.parent().find('.infinite-swipe-target');
    }

    var getWidth = (function () {
      var w;
      return function (ignore_cache) {
        if (ignore_cache || !w)
          w = options.getWidth ? options.getWidth() : $target.width();
        return w;
      };
    }());

    var swipePrev = function () { p--; animate(); };
    var swipeNext = function () { p++; animate(); };
    var animate = function (callback) {
      if (curr_px > 30) p--;
      else if (curr_px < -30) p++;

      if (p === 0) {
        if (options.infinite) {
          p = total;
          offset--;
          $target.each(function (idx) {
            $(this).css('left', total * (offset + idx) * 100 + '%');
          });
        } else {
          p = 1;
        }
      } else if (p === total + 1) {
        if (options.infinite) {
          p = 1;
          offset++;
          // fixed coordinates after transition
          setTimeout(function () {
            $target.each(function (idx) {
              $(this).css('left', total * (offset + idx) * 100 + '%');
            });
          }, options.transition_ms);
        } else {
          p = total;
        }
      }

      curr_px = 0;
      t = -((p - 1 + offset * total) * getWidth()) / total;

      if (isTransformSupported) {
        $target.css({
          '-webkit-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-moz-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-ms-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-o-transform': 'translate3D(' + t + 'px, 0, 0)',
          'transform': 'translate3D(' + t + 'px, 0, 0)'
        });
      } else {
        $target.css('opacity', 0.7).animate({
          'margin-left': t + 'px',
          'opacity': 1
        }, options.transition_ms);
      }
      if (!options.infinite) {
        if (options.$prev) options.$prev.toggleClass('disabled', p === 1);
        if (options.$next) options.$next.toggleClass('disabled', p === total);
      }
      if (options.$curr) options.$curr.text(p);
      if (callback) {
        setTimeout(callback, options.transition_ms);
      }
    };
    var animate_px = function (px) {
      curr_px = px;
      t = -((p - 1 + offset * total) * getWidth()) / total + px;
      if (isTransformSupported) {
        $target.css({
          '-webkit-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-moz-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-ms-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-o-transform': 'translate3D(' + t + 'px, 0, 0)',
          'transform': 'translate3D(' + t + 'px, 0, 0)'
        });
      } else {
        $target.css({
          'margin-left': t + 'px',
          'opacity': 1
        });
      }
    };

    var events = 'touchstart click', ua = navigator.userAgent;
    if (ua.indexOf('Android') >= 0) {
      events = 'touchstart';
    }

    if (options.$prev) options.$prev.on(events, function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (p === 1 && !options.infinite) return;
      swipePrev();
    });
    if (options.$next) options.$next.on(events, function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (p === total && !options.infinite) return;
      swipeNext();
    });

    var swiped = false;
    $el.on('dragleft', function (e, velocityX, deltaX) {
      if (swiped) return;
      $(window).on('touchmove', disabled_touch);
      if (Math.abs(velocityX) > 5 && !(p === total && !options.infinite)) {
        e.preventDefault();
        e.stopPropagation();
        swiped = true;
        curr_px = 0;
        $target.removeClass('infinite-swipe-disabled-transition');
        swipeNext();
        return;
      }
      var l = deltaX;
      animate_px(l);
    }).on('dragright', function (e, velocityX, deltaX) {
      if (swiped) return;
      $(window).on('touchmove', disabled_touch);
      if (Math.abs(velocityX) > 5 && !(p === 1 && !options.infinite)) {
        e.preventDefault();
        e.stopPropagation();
        swiped = true;
        curr_px = 0;
        $target.removeClass('infinite-swipe-disabled-transition');
        swipePrev();
        return;
      }
      var l = deltaX;
      animate_px(l);
    }).on('dragstart', function (e) {
      $target.addClass('infinite-swipe-disabled-transition');
    }).on('dragend', function (e) {
      $target.removeClass('infinite-swipe-disabled-transition');
      if (!swiped) animate();
      swiped = false;
      $(window).off('touchmove', disabled_touch);
    }).on('swipe_total', function (e, new_total) {
      if (total === new_total) return;
      total = new_total;
      if (p > total) p = total;
      getWidth(true);
      offset = 0;
      animate();
      $target.each(function (idx) {
        $(this).css('left', total * (offset + idx) * 100 + '%');
      });
    }).on('swipe_page', function (e, new_page) {
      if (new_page > total) return;
      p = new_page;
      animate();
    });

    $(window).on('resize orientationchange', function (e) {
      getWidth(true);
      $target.addClass('infinite-swipe-resizing');
      animate(function () {
        $target.removeClass('infinite-swipe-resizing');
      });
    });

    // init
    if (!options.infinite) {
      if (options.$prev) options.$prev.toggleClass('disabled', p === 1);
    }
  };

  $.fn.infiniteSwipeEvent = function () {
    var $el = $(this),
        mdown = false,
        mdirection = null,
        mdownpos = {x:null,y:null},
        mpos = {x:null,y:null},
        mtimestamp;

    $el.on('touchstart', function (e) {
      var pageX = e.originalEvent.touches[0].pageX,
          pageY = e.originalEvent.touches[0].pageY;

      mdown = true;
      mdirection = null;
      mdownpos.x = mpos.x = pageX;
      mdownpos.y = mpos.y = pageY;
      mtimestamp = e.timeStamp;
    }).on('touchend touchleave', function (e) {
      if (mdown) $el.trigger('dragend');
      mdown = false;
    }).on('touchmove', function (e) {
      // ignore vertical oriented mousemove
      if (!mdown || mdirection === 'y') return;

      var pageX = e.originalEvent.touches[0].pageX,
          pageY = e.originalEvent.touches[0].pageY,
          posdiff = {x: mpos.x - pageX, y: mpos.y - pageY};
      if (!mdirection) {
        mdirection = Math.abs(posdiff.x) >= Math.abs(posdiff.y) ? 'x' : 'y';
        if (mdirection === 'y') return;
        $el.trigger('dragstart');
      }

      var timediff = e.timeStamp - mtimestamp,
          delta = {x: mdownpos.x - pageX, y: mdownpos.y - pageY},
          velocity = Math.abs(posdiff.x / timediff);

      if (posdiff.x > 0) {
        $el.trigger('dragleft', [velocity, -delta.x]);
      } else if (posdiff.x < 0) {
        $el.trigger('dragright', [velocity, -delta.x]);
      }

      mpos.x = pageX;
      mpos.y = pageY;
      mtimestamp = e.timeStamp;
    });
  };

  $.fn.infiniteSwipe = function (options) {
    return this.each(function () {
      $(this).infiniteSwipeEvent();
      swipe.call(this, options);
    });
  };
}));
