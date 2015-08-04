// Required for exposing test results to the Sauce Labs API.
// Can be removed when the following issue is fixed:
// https://github.com/axemclion/grunt-saucelabs/issues/84
QUnit.done(function (details) {
  window.global_test_results = details;
});

$('.stage1').infiniteSwipe({
  $target: $('.target1'),
  total: 3,
  $prev: $('.stage1 .prev'),
  $next: $('.stage1 .next'),
  $curr: $('.stage1 .curr')
});

$('.stage2').infiniteSwipe({
  $target: $('.target2'),
  total: 3,
  $prev: $('.stage2 .prev'),
  $next: $('.stage2 .next'),
  $curr: $('.stage2 .curr'),
  infinite: true
});

test('navigation', function () {
  expect(6);
  strictEqual($('.stage1 .prev').hasClass('disabled'), true,
      'on 1 page, prev button should has disabled class');
  strictEqual($('.stage1 .next').hasClass('disabled'), false,
      'on 1 page, next button should not has disabled class');
  strictEqual($('.stage1 .curr').text(), '1',
      'on 1 page, text of current element should be "1"');
  $('.stage1 .next').click();
  $('.stage1 .next').click();
  strictEqual($('.stage1 .prev').hasClass('disabled'), false,
      'on last page, prev button should not has disabled class');
  strictEqual($('.stage1 .next').hasClass('disabled'), true,
      'on last page, next button should has disabled class');
  strictEqual($('.stage1 .curr').text(), '3',
      'on last(3rd) page, text of current element should be "3"');
});
test('infinite swipe: navigation', function () {
  expect(10);
  strictEqual($('.stage2 .prev').hasClass('disabled'), false,
      'on 1 page, prev button should not has disabled class');
  strictEqual($('.stage2 .next').hasClass('disabled'), false,
      'on 1 page, next button should not has disabled class');
  strictEqual($('.stage2 .curr').text(), '1',
      'on 1 page, text of current element should be "1"');
  $('.stage2 .next').click();
  strictEqual($('.stage2 .curr').text(), '2',
      'on last(3rd) page, text of current element should be "3"');
  $('.stage2 .next').click();
  strictEqual($('.stage2 .prev').hasClass('disabled'), false,
      'on last page, prev button should not has disabled class');
  strictEqual($('.stage2 .next').hasClass('disabled'), false,
      'on last page, next button should not has disabled class');
  strictEqual($('.stage2 .curr').text(), '3',
      'on last(3rd) page, text of current element should be "3"');
  $('.stage2 .next').click();
  strictEqual($('.stage2 .curr').text(), '1',
      'after click next button on last(3rd) page, text of current element should be "1"');

  $('.stage2').trigger('swipe_page', 3);
  strictEqual($('.stage2 .curr').text(), '3',
      'after trigger swipe_page event, current page should changed to the value.');
  $('.stage2').trigger('swipe_page', 5);
  strictEqual($('.stage2 .curr').text(), '3',
      'if the value of swipe_page is bigger than total page, nothing happens.');
});
