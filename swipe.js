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

  var Swipe = function ($el, options) {
    options = $.extend({
      $target: null,
      $prev: null,
      $next: null,
      $curr: null,
      total: 1,
      infinite: false,
      transition_ms: 300,
      onPage: null
    }, options);

    this.$el = $el;
    this.$target = options.$target || $el;
    this.p = 1;
    this.offset = 0;
    this.total = options.total;
    this.curr_px = 0;
    this.disabled_touch = false;
    this.options = options;
    this.init();
  };
  Swipe.prototype = {
    init: function () {
      this.$el.addClass('infinite-swipe-stage');
      this.$target.addClass('infinite-swipe-target').css({
        '-webkit-transition-delay': this.options.transition_ms,
        '-moz-transition-delay': this.options.transition_ms,
        '-ms-transition-delay': this.options.transition_ms,
        '-o-transition-delay': this.options.transition_ms,
        'transition-delay': this.options.transition_ms
      });

      if (this.options.infinite) {
        this.$target.clone().attr('aria-hidden', true)
               .addClass('infinite-swipe-target-clone')
               .css('left', this.options.total * 100 + '%')
               .insertBefore(this.$target);
        this.$target = this.$target.parent().find('.infinite-swipe-target');
      }

      this.addListeners();

      // init
      if (!this.options.infinite && this.options.$prev) {
        this.options.$prev.toggleClass('disabled', this.p === 1);
      }
    },
    destroy: function () {
      this.$el.removeClass('infinite-swipe-stage');
      this.$target.filter('.infinite-swipe-target-clone').remove();
      this.$el.find('.infinite-swipe-target').
          removeClass('infinite-swipe-target');
      this.removeListeners();
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
        this.$target.removeClass('infinite-swipe-disabled-transition');
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
        this.$target.removeClass('infinite-swipe-disabled-transition');
        this.swipePrev();
        return;
      }
      var l = deltaX;
      this.animate_px(l);
    },
    onDragStart: function (e) {
      this.$target.addClass('infinite-swipe-disabled-transition');
    },
    onDragEnd: function (e) {
      this.$target.removeClass('infinite-swipe-disabled-transition');
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
      if (new_page > this.total) return;
      this.p = new_page;
      this.animate();
    },
    onWindowResize: function (e) {
      var this_ = this;
      this.getWidth(true);
      this.$target.addClass('infinite-swipe-resizing');
      this.animate(function () {
        this_.$target.removeClass('infinite-swipe-resizing');
      });
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
    swipePrev: function () { this.p--; this.animate(); },
    swipeNext: function () { this.p++; this.animate(); },
    animate: function (callback) {
      var this_ = this;

      if (this.curr_px > 30) this.p--;
      else if (this.curr_px < -30) this.p++;

      if (this.p === 0) {
        if (this.options.infinite) {
          this.p = this.total;
          this.offset--;
          this.$target.each(function (idx) {
            $(this).css('left', this_.total *
              (this_.offset + idx) * 100 + '%');
          });
        } else {
          this.p = 1;
        }
      } else if (this.p === this.total + 1) {
        if (this.options.infinite) {
          this.p = 1;
          this.offset++;
          // fixed coordinates after transition
          setTimeout(function () {
            this_.$target.each(function (idx) {
              $(this).css('left', this_.total *
                (this_.offset + idx) * 100 + '%');
            });
          }, this.options.transition_ms);
        } else {
          this.p = this.total;
        }
      }

      this.curr_px = 0;

      var t = -((this.p - 1 + this.offset * this.total) *
          this.getWidth()) / this.total;

      if (isTransformSupported) {
        this.$target.css({
          '-webkit-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-moz-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-ms-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-o-transform': 'translate3D(' + t + 'px, 0, 0)',
          'transform': 'translate3D(' + t + 'px, 0, 0)'
        });
      } else {
        this.$target.css('opacity', 0.7).animate({
          'margin-left': t + 'px',
          'opacity': 1
        }, this.options.transition_ms);
      }
      if (!this.options.infinite) {
        if (this.options.$prev)
          this.options.$prev.toggleClass('disabled', this.p === 1);
        if (this.options.$next)
          this.options.$next.toggleClass('disabled', this.p === this.total);
      }
      if (this.options.$curr) this.options.$curr.text(this.p);
      if (this.options.onPage) this.options.onPage(this.p);
      if (callback) {
        setTimeout(callback, this.options.transition_ms);
      }
    },
    animate_px: function (px) {
      this.curr_px = px;
      var t = -((this.p - 1 + this.offset * this.total) *
          this.getWidth()) / this.total + px;
      if (isTransformSupported) {
        this.$target.css({
          '-webkit-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-moz-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-ms-transform': 'translate3D(' + t + 'px, 0, 0)',
          '-o-transform': 'translate3D(' + t + 'px, 0, 0)',
          'transform': 'translate3D(' + t + 'px, 0, 0)'
        });
      } else {
        this.$target.css({
          'margin-left': t + 'px',
          'opacity': 1
        });
      }
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
