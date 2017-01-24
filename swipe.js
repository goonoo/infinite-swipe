/*!
 * infinite-swipe 1.1.5
 * https://github.com/mctenshi/infinite-swipe
 *
 * infinite swipe is fork of https://github.com/mctenshi/recopick-swipe
 *
 * (c) 2015 mctenshi (mctenshi@gmail.com)
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

  var animateSlide = function($target_wrap, pos, options) {
    if (isTransformSupported) {
      $target_wrap.css({
        '-webkit-transform': 'translate3D(' + pos + 'px, 0, 0)',
        '-moz-transform': 'translate3D(' + pos + 'px, 0, 0)',
        '-ms-transform': 'translate3D(' + pos + 'px, 0, 0)',
        '-o-transform': 'translate3D(' + pos + 'px, 0, 0)',
        'transform': 'translate3D(' + pos + 'px, 0, 0)'
      });
    } else {
      $target_wrap.css('opacity', 0.7).animate({
        'margin-left': t + 'px',
        'opacity': 1
      }, options.transition_ms);
    }
  };

  var animateFadeIn = function($target_wrap, pos, options) {
    $target_wrap.animate({'opacity': 0}, options.transition_ms,
      function() {
        $(this).css({
          'margin-left': pos + 'px'
        });
        $(this).animate({'opacity': 1});
      }
    );
  };

  var animateNone = function($target_wrap, pos, options) {
    $target_wrap.css({
      'margin-left': pos + 'px'
    });
  };

  var animateFactory = function(type) {
    switch(type) {
    case 'none':
      return animateNone;
    case 'slide':
      return animateSlide;
    case 'fadeIn':
      return animateFadeIn;
    default:
      return animateSlide;
    }
  };

  var Swipe = function ($el, options) {
    options = $.extend({
      $target_wrap: null,
      $target: null,
      $prev: null,
      $next: null,
      $curr: null,
      $autoswipe_pause_el: null,
      total: 1,
      transition_ms: null,
      animation_type: 'slide',
      infinite: false,
      autoswipe_seconds: 0,
      onPage: null
    }, options);

    if (options.transition_ms === null)
      options.transition_ms = options.animation_type === 'slide' ? 200 : 0;

    this.$el = $el;
    this.$target_wrap = options.$target_wrap || $el;
    this.$target = options.$target || $el;
    this.$autoswipe_pause_el = options.$autoswipe_pause_el || $el;
    this.p = 1;
    this.offset = 0;
    this.total = options.total;
    this.curr_px = 0;
    this.disabled_touch = false;
    this.options = options;
    this.init();
  };
  Swipe.prototype = {
    _setTransitionDuration: function (ms) {
      var el = this.$target_wrap.get(0);
      el.style.webkitTransitionDuration = ms + 'ms';
      el.style.mozTransitionDuration = ms + 'ms';
      el.style.msTransitionDuration = ms + 'ms';
      el.style.oTransitionDuration = ms + 'ms';
      el.style.transitionDuration = ms + 'ms';
    },
    init: function () {
      this.$el.addClass('infinite-swipe-stage');
      this.$target_wrap.addClass('infinite-swipe-target-wrap');
      this._setTransitionDuration(this.options.transition_ms);
      this.$target.addClass('infinite-swipe-target');

      if (this.options.infinite) {
        var clone1 = this.$target.clone().attr('aria-hidden', true)
               .addClass('infinite-swipe-target-clone')
               .css('left', '-' + this.options.total * 100 + '%');
        var clone2 = this.$target.clone().attr('aria-hidden', true)
               .addClass('infinite-swipe-target-clone')
               .css('left', this.options.total * 100 + '%');
        clone1.insertBefore(this.$target);
        clone2.insertBefore(this.$target);
        this.$target = this.$target.parent().find('.infinite-swipe-target');
      }

      this.addListeners();

      // init
      if (!this.options.infinite && this.options.$prev) {
        this.options.$prev.toggleClass('disabled', this.p === 1);
      }

      if (this.options.autoswipe_seconds > 0) {
        this.initAutoswipe();
      }
    },
    initAutoswipe: function () {
      var this_ = this;
      this._as_next = function () {
        if (this_._as_timeout_id) {
          clearTimeout(this_._as_timeout_id);
        }
        this_._as_timeout_id = setTimeout(function () {
          if (!this_._as_pause) this_.swipeNext();
          this_._as_timeout_id = null;
          this_._as_next();
        }, this_.options.autoswipe_seconds * 1000);
      };
      this._as_resume_event = function () { this_._as_next(); };
      this._as_pause_event = function () {
        if (this_._as_timeout_id) {
          clearTimeout(this_._as_timeout_id);
          this_._as_timeout_id = null;
        }
      };
      this._as_next();

      this.$autoswipe_pause_el
          .on('mouseenter focusin', this._as_pause_event)
          .on('mouseleave focusout', this._as_resume_event);
    },
    onPrev: function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.p === 1 && !this.options.infinite) return;
      this.swipePrev();
    },
    onNext: function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.p === this.total && !this.options.infinite) return;
      this.swipeNext();
    },
    onDragLeft: function (e, velocityX, deltaX) {
      if (this._swiped) return;
      $(window).on('touchmove', this.disabled_touch);
      if (Math.abs(velocityX) > 5 &&
          !(this.p === this.total && !this.options.infinite)) {
        e.preventDefault();
        e.stopPropagation();
        this._swiped = true;
        this.curr_px = 0;
        this._setTransitionDuration(0);
        this.swipeNext();
        return;
      }
      var l = deltaX;
      this.animate_px(l);
    },
    onDragRight: function (e, velocityX, deltaX) {
      if (this._swiped) return;
      $(window).on('touchmove', this.disabled_touch);
      if (Math.abs(velocityX) > 5 &&
          !(this.p === this.total && !this.options.infinite)) {
        e.preventDefault();
        e.stopPropagation();
        this._swiped = true;
        this.curr_px = 0;
        this._setTransitionDuration(0);
        this.swipePrev();
        return;
      }
      var l = deltaX;
      this.animate_px(l);
    },
    onDragStart: function (e) {
      this._setTransitionDuration(0);
    },
    onDragEnd: function (e) {
      this._setTransitionDuration(this.options.transition_ms);
      if (!this._swiped) this.animate();
      this._swiped = false;
      $(window).off('touchmove', this.disabled_touch);
    },
    onSwipeTotal: function (e, new_total) {
      var this_ = this;

      if (this.total === new_total) return;
      this.total = new_total;
      if (this.p > this.total) this.p = this.total;
      this.getWidth(true);
      this.offset = 0;
      this.animate();
      this.$target.each(function (idx) {
        $(this).css('left', this_.total * (this_.offset + idx) * 100 + '%');
      });
    },
    onSwipePage: function (e, new_page) {
      if (new_page < 1 || new_page > this.total) return;
      this.p = new_page;
      this.animate();
    },
    onWindowResize: function (e) {
      var this_ = this;
      setTimeout(function () {
        var old_w = this_.getWidth();
        var new_w = this_.getWidth(true);
        if (old_w === new_w) return;
        this_.$target_wrap.addClass('infinite-swipe-resizing');
        this_.animate(0, function () {
          this_.$target_wrap.removeClass('infinite-swipe-resizing');
        });
      }, 200);
    },
    addListeners: function () {
      var this_ = this;
      var events = 'touchstart click', ua = navigator.userAgent;
      if (ua.indexOf('Android') >= 0) {
        events = 'touchstart';
      }

      if (this.options.$prev)
        this.options.$prev.on(events, $.proxy(this.onPrev, this));
      if (this.options.$next)
        this.options.$next.on(events, $.proxy(this.onNext, this));

      this._dragleft_event = function() { this_.onDragLeft.apply(this_, arguments); };
      this._dragright_event = function() { this_.onDragRight.apply(this_, arguments); };
      this._dragstart_event = function() { this_.onDragStart.apply(this_, arguments); };
      this._dragend_event = function() { this_.onDragEnd.apply(this_, arguments); };
      this._swipetotal_event = function() { this_.onSwipeTotal.apply(this_, arguments); };
      this._swipepage_event = function() { this_.onSwipePage.apply(this_, arguments); };
      this.$el.on('dragleft', this._dragleft_event)
              .on('dragright', this._dragright_event)
              .on('dragstart', this._dragstart_event)
              .on('dragend', this._dragend_event)
              .on('swipe_total', this._swipetotal_event)
              .on('swipe_page', this._swipepage_event);

      this._resize_event = function () { this_.onWindowResize(); };
      $(window).on('resize orientationchange', this._resize_event);
    },
    removeListeners: function () {
      var events = 'touchstart click', ua = navigator.userAgent;
      if (ua.indexOf('Android') >= 0) {
        events = 'touchstart';
      }

      if (this.options.$prev)
        this.options.$prev.off(events, $.proxy(this.onPrev, this));
      if (this.options.$next)
        this.options.$next.off(events, $.proxy(this.onNext, this));

      this.$el.off('dragleft', this._dragleft_event)
              .off('dragright', this._dragright_event)
              .off('dragstart', this._dragstart_event)
              .off('dragend', this._dragend_event)
              .off('swipe_total', this._swipetotal_event)
              .off('swipe_page', this._swipepage_event);

      $(window).off('resize orientationchange', this._resize_event);
    },
    getWidth: function (ignore_cache) {
      if (ignore_cache || !this._w)
        this._w = this.options.getWidth ? this.options.getWidth() :
            this.$target.width();
      return this._w;
    },
    swipePrev: function () { this.animate(-1); },
    swipeNext: function () { this.animate(1); },
    animate: function (pages_to_add, callback) {
      var this_ = this;
      var old_page = this.p;

      if (pages_to_add) this.p += pages_to_add;
      if (this.curr_px > 30) this.p--;
      else if (this.curr_px < -30) this.p++;

      if (!this.options.infinite) {
        this.p = Math.max(Math.min(this.p, this.total), 1);
      } else {
        if (this.p === this.total + 1) {
          this.p = 1;
          this.offset++;
          // fixed coordinates after transition
          this.$target.each(function (idx) {
            var left = this_.total * (this_.offset + idx - 1) * 100;
            $(this).css('left', left + '%');
          });
        } else if (this.p === 0) {
          this.p = this.total;
          this.offset--;
          this.$target.each(function (idx) {
            var left = this_.total * (this_.offset + idx - 1) * 100;
            $(this).css('left', left + '%');
          });
        }
      }

      this.curr_px = 0;

      var t = -((this.p - 1 + this.offset * this.total) *
          this.getWidth(true)) / this.total;

      animateFactory(this.options.animation_type)(this.$target_wrap, t, this.options);
      if (!this.options.infinite) {
        if (this.options.$prev)
          this.options.$prev.toggleClass('disabled', this.p === 1);
        if (this.options.$next)
          this.options.$next.toggleClass('disabled', this.p === this.total);
      }
      if (this.options.$curr) this.options.$curr.text(this.p);
      if (old_page != this.p && this.options.onPage)
        this.options.onPage(this.p);
      if (callback) {
        setTimeout(callback, this.options.transition_ms);
      }
    },
    animate_px: function (px) {
      this.curr_px = px;
      var t = -((this.p - 1 + this.offset * this.total) *
          this.getWidth()) / this.total + px;
      animateFactory(this.options.animation_type)(this.$target_wrap, t, this.options);
    },

    // ## methods for user
    destroy: function () {
      this.$el.removeClass('infinite-swipe-stage');
      this.$target_wrap.removeClass('infinite-swipe-target-wrap');
      this.$target.filter('.infinite-swipe-target-clone').remove();
      this.$el.find('.infinite-swipe-target').
          removeClass('infinite-swipe-target');
      this.removeListeners();
      if (this.options.autoswipe_seconds > 0) {
        if (this._as_timeout_id) {
          clearTimeout(this._as_timeout_id);
          this._as_timeout_id = null;
        }
        this.$el.off('mouseenter focusin', this._as_pause_event)
                .off('mouseleave focusout', this._as_resume_event);
      }
    },
    // pause autoswipe
    pause: function () {
      this._as_pause = true;
    },
    // resume autoswipe
    resume: function () {
      this._as_pause = false;
      this._as_next();
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
      if (typeof options == "string") {
        var inst = $(this).data('infiniteswipe');
        if (inst) inst[options]();
      } else {
        $(this).infiniteSwipeEvent();
        $(this).data('infiniteswipe', new Swipe($(this), options));
      }
    });
  };
}));
