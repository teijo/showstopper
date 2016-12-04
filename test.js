const Showstopper = require('./showstopper.js');
const assert = require('assert');
const {it, describe} = require('mocha');

describe('Showstopper', () => {
  let feedbackEvaluated = false;
  const testArgument = 1.0;
  const testFeedback = true;
  const testReturnValue = 3.0;

  function evaluateFeedback(accept, reject, state, feedback) {
    feedbackEvaluated = true;
    assert(state === testFeedback);
    if (feedback === testFeedback) {
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

  describe('action', () => {
    describe('with closed state', () => {
      const a = testFunction(testArgument)(() => {
        return false; // <- returned if halted
      });

      it('returns wrapped function result', () => {
        assert(a === testReturnValue);
      });
    });

    describe('before feedback', () => {
      describe('after', () => {
        const isOpen = s.giveFeedback(testFeedback);

        it('has been evaluated', () => {
          assert(feedbackEvaluated === true);
        });

        it('is open', () => {
          assert(isOpen === false);
        });
      });
    });

    describe('with open state', () => {
      const isOpen = s.giveFeedback('bar to fail');

      it('causes action to return fallback value', () => {
        assert(isOpen === true);
      });

      describe('calling action', () => {
        const b = testFunction(testArgument)((state) => {
          return state;
        });

        it('causes action to return fallback value', () => {
          assert(b === 'bar to fail');
        });
      });
    });
  });
});
