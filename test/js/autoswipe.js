// Required for exposing test results to the Sauce Labs API.
// Can be removed when the following issue is fixed:
// https://github.com/axemclion/grunt-saucelabs/issues/84
QUnit.done(function (details) {
  window.global_test_results = details;
});

asyncTest('autoswipe with infinite option', function (done) {
  expect(4);

  $('.stage1').infiniteSwipe({
    $target: $('.target1'),
    total: 3,
    $prev: $('.stage1 .prev'),
    $next: $('.stage1 .next'),
    $curr: $('.stage1 .curr'),
    infinite: true,
    autoswipe_seconds: .3
  });

  var is = $('.stage1').data('infiniteswipe');
  strictEqual(is.p, 1);
  setTimeout(function () {
    strictEqual(is.p, 2);
    setTimeout(function () {
      strictEqual(is.p, 3);
      setTimeout(function () {
        strictEqual(is.p, 1);
        QUnit.start();
      }, 300);
    }, 300);
  }, 300 + 100); // delay 100ms to make sure swipe page has done
});

asyncTest('autoswipe without infinite option', function (done) {
  expect(4);

  $('.stage2').infiniteSwipe({
    $target: $('.target2'),
    total: 3,
    $prev: $('.stage2 .prev'),
    $next: $('.stage2 .next'),
    $curr: $('.stage2 .curr'),
    autoswipe_seconds: .3
  });

  var is = $('.stage2').data('infiniteswipe');
  strictEqual(is.p, 1);
  setTimeout(function () {
    strictEqual(is.p, 2);
    setTimeout(function () {
      strictEqual(is.p, 3);
      setTimeout(function () {
        strictEqual(is.p, 3);
        QUnit.start();
      }, 300);
    }, 300);
  }, 300 + 100); // delay 100ms to make sure swipe page has done
});
