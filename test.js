const Showstopper = require('./showstopper.js');
const assert = require('assert');
const {it} = require('mocha');

it('tests random things', function(done) {
  let feedbackEvaluated = false;
  const testArgument = 1.0;
  const testFeedback = 2.0;

  function evaluateFeedback(data) {
    feedbackEvaluated = true;
    return (data === testFeedback); // If disconnected, open circuit
  }

  const s = Showstopper(evaluateFeedback, 1200);

  const evaluateAction = (feedback, delta) => { // Monitoring arguments
    return (arg) => { // Original call arguments
      assert(delta <= 1);
      assert(arg === testArgument);
      assert(feedback === 2.0);
      return true;
    };
  };

  const doAction = (arg) => {
    assert(arg === testArgument);
    return 1;
  };

  const action = s.register(doAction, evaluateAction);

  const a = action(testArgument)(() => {
    return false; // <- returned if halted
  });
  assert(a === 1);

  assert(feedbackEvaluated === false);
  const isOpen = s.giveFeedback(testFeedback);
  assert(feedbackEvaluated === true);
  assert(isOpen === false);

  done();
});
