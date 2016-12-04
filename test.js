const Showstopper = require('./showstopper.js');
const assert = require('assert');
const {it} = require('mocha');

it('tests random things', function(done) {
  let feedbackEvaluated = false;
  const testArgument = 1.0;
  const testFeedback = true;
  const testReturnValue = 3.0;

  function evaluateFeedback(accept, reject, state, feedback) {
    feedbackEvaluated = true;
    assert(state === testFeedback);
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
        return testReturnValue;
      },
      (accept, reject, state, feedback) => { // Monitoring arguments
        return (arg) => { // Original call arguments
          assert(state === testFeedback);
          assert(arg === testArgument);
          assert(feedback === testFeedback);
          accept(feedback);
        };
      });

  const a = testFunction(testArgument)(() => {
    return false; // <- returned if halted
  });
  assert(a === testReturnValue);

  assert(feedbackEvaluated === false);
  const isOpen = s.giveFeedback(testFeedback);
  assert(feedbackEvaluated === true);
  assert(isOpen === false);

  done();
});
