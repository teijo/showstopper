const Showstopper = require('./showstopper.js');
const {equal, isBelow, isAbove} = require('chai').assert;
const {it, describe, beforeEach} = require('mocha');

const TestTimer = (initialMs) => {
  let modified = Date.now();
  let targetMs = initialMs;
  let isIncrementing = true;
  return {
    setTarget(newTargetMs) {
      isIncrementing = newTargetMs > targetMs;
      targetMs = newTargetMs;
      modified = Date.now();
    },
    get() {
      let timeSinceModification = (Date.now() - modified);
      if (isIncrementing) {
        return Math.min(timeSinceModification, targetMs);
      } else {
        return Math.max(-timeSinceModification, targetMs);
      }
    }
  }
};

describe('Test timer', () => {
  describe('when only initialized', () => {
    const t = TestTimer(1);

    it('returns initial value', () => {
      equal(t.get(), 1);
    });
  });

  describe('when incrementing', () => {
    let t = 0;

    beforeEach(() => {
      t = TestTimer(0);
      t.setTarget(100);
    });

    it('returns less than target value immediately', () => {
      isBelow(t.get(), 100);
    });

    it('timer increases', (done) => {
      setTimeout(()=> {
        isAbove(t.get(), 0);
        done();
      }, 1);
    });

    it('returns at most target value', (done) => {
      setTimeout(() => {
        equal(t.get(), 100);
        done();
      }, 200);
    });
  });

  describe('when decrementing', () => {
    let t = 0;

    beforeEach(() => {
      t = TestTimer(0);
      t.setTarget(-100);
    });

    it('returns greater than target value immediately', () => {
      isAbove(t.get(), -100);
    });

    it('timer decreases', (done) => {
      setTimeout(()=> {
        isBelow(t.get(), 0);
        done();
      }, 1);
    });

    it('returns at most target value', (done) => {
      setTimeout(() => {
        equal(t.get(), -100);
        done();
      }, 200);
    });
  });
});

describe('Showstopper', () => {
  let feedbackEvaluated = false;
  const testArgument = 1.0;
  const testFeedback = true;
  const testReturnValue = 3.0;

  function evaluateFeedback(accept, reject, state, feedback) {
    feedbackEvaluated = true;
    equal(state, testFeedback);
    if (feedback === testFeedback) {
      accept(feedback);
    } else {
      reject(feedback);
    }
  }

  const s = Showstopper(evaluateFeedback, 1200, true);

  const testFunction = s.action(
      (arg) => {
        equal(arg, testArgument);
        return testReturnValue;
      },
      (accept, reject, state, feedback) => { // Monitoring arguments
        return (arg) => { // Original call arguments
          equal(state, testFeedback);
          equal(arg, testArgument);
          equal(feedback, testFeedback);
          accept(feedback);
        };
      });

  describe('action', () => {
    describe('with closed state', () => {
      const a = testFunction(testArgument)(() => {
        return false; // <- returned if halted
      });

      it('returns wrapped function result', () => {
        equal(a, testReturnValue);
      });
    });

    describe('before feedback', () => {
      describe('after', () => {
        const isOpen = s.giveFeedback(testFeedback);

        it('has been evaluated', () => {
          equal(feedbackEvaluated, true);
        });

        it('is open', () => {
          equal(isOpen, false);
        });
      });
    });

    describe('with open state', () => {
      const isOpen = s.giveFeedback('bar to fail');

      it('causes action to return fallback value', () => {
        equal(isOpen, true);
      });

      describe('calling action', () => {
        const b = testFunction(testArgument)((state) => {
          return state;
        });

        it('causes action to return fallback value', () => {
          equal(b, 'bar to fail');
        });
      });
    });
  });
});
