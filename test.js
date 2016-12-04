const Showstopper = require('./showstopper.js');
const assert = require('assert');
const {it} = require('mocha');

it('tests random things', function(done) {
  let feedbackEvaluated = false;
  const testArgument = 1.0;
  const testFeedback = true;

  function evaluateFeedback(accept, reject, prev, feedback) {
    feedbackEvaluated = true;
    assert(prev === testFeedback);
    if (feedback) {
      accept(feedback);
    } else {
      reject(feedback);
    }
  }

  const s = Showstopper(evaluateFeedback, 1200, true);

  const testFunction = s.action(
      (arg) => {
        assert(arg === testArgument);
        return 1;
      },
      (accept, reject, feedback, delta) => { // Monitoring arguments
        return (arg) => { // Original call arguments
          assert(delta <= 1);
          assert(arg === testArgument);
          assert(feedback === testFeedback);
          accept();
        };
      });

  const a = testFunction(testArgument)(() => {
    return false; // <- returned if halted
  });
  assert(a === 1);

  assert(feedbackEvaluated === false);
  const isOpen = s.giveFeedback(testFeedback);
  assert(feedbackEvaluated === true);
  assert(isOpen === false);

  done();
});
