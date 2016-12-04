const use_debug = false;
const debug = (msg) => use_debug ? console.log(msg) : null;

const Showstopper = (immediateFeedbackEvaluator, maximumFeedbackSilence, initialState) => {
  let actions = [];

  let feedbackTimeout = null;
  let isOpenCircuit = false;
  let previousState = initialState;

  const accept = (state) => {
    previousState = state;
    isOpenCircuit = false;
  };

  const reject = (state) => {
    previousState = state;
    isOpenCircuit = true;
  };

  return {
    action(action, actionEffectEvaluator, effectPropagationDelay = 0) {
      return function(/*args delegated to action*/) {
        const args = Array.from(arguments);
        return (closedCircuitFallback) => {
          actions.push({eval: actionEffectEvaluator, actionArguments: args, earliestEvalDate: new Date(Date.now() + effectPropagationDelay)});
          return isOpenCircuit ? closedCircuitFallback(previousState) : action.apply(null, args);
        };
      };
    },

    // Must be invoked at least every minimumFeedbackInterval
    giveFeedback(feedback) {
      clearTimeout(feedbackTimeout);
      feedbackTimeout = setTimeout(() => isOpenCircuit = true, maximumFeedbackSilence);

      immediateFeedbackEvaluator(accept, reject, previousState, feedback);

      debug(`Circuit ${isOpenCircuit ? 'open' : 'closed'} after immediate evaluation`);

      if (!isOpenCircuit) {
        const now = new Date();

        actions = actions
            // TODO: side effects out of .map()
            .map(cmd => {
              // Evaluate latest feedback against earlier arguments
              const deltaTime = Math.min(0, now - cmd.earliestEvalDate);

              debug(`Time to command evaluation ${-deltaTime}ms`);

              // Minimum propagation delay for evaluation
              if (deltaTime < 0) {
                return {evaluated: false, cmd: cmd};
              }

              // A single false must break the system
              cmd.eval(accept, reject, previousState, feedback).apply(null, cmd.actionArguments);
              debug(`Circuit ${isOpenCircuit ? 'open' : 'closed'} after command evaluation`);

              return {evaluated: true};
            })
            // Keep actions that haven't yet been evaluated
            .filter(result => result.evaluated === false)
            // Unwrap back to original array
            .map(result => result.cmd);
      }

      // State after evaluating effects against latest feedback
      return isOpenCircuit;
    }
  };
};

module.exports = Showstopper;
