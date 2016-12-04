const use_debug = false;
const debug = (msg) => use_debug ? console.log(msg) : null;

const Showstopper = (immediateFeedbackEvaluator, maximumFeedbackSilence) => {
  let actions = [];

  let feedbackTimeout = null;
  let isOpen = false;

  return {
    register(action, actionEffectEvaluator, effectPropagationDelay = 0) {
      return function(/*args delegated to action*/) {
        const args = Array.from(arguments);
        return (closedCircuitFallback) => {
          actions.push({eval: actionEffectEvaluator, actionArguments: args, earliestEvalDate: new Date(Date.now() + effectPropagationDelay)});
          return isOpen ? closedCircuitFallback() : action.apply(null, args);
        };
      };
    },

    // Must be invoked at least every minimumFeedbackInterval
    giveFeedback(feedback) {
      clearTimeout(feedbackTimeout);
      feedbackTimeout = setTimeout(() => isOpen = true, maximumFeedbackSilence);

      isOpen = !immediateFeedbackEvaluator(feedback);

      debug(`Circuit ${isOpen ? 'open' : 'closed'} after immediate evaluation`);

      if (!isOpen) {
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
              isOpen = isOpen || !cmd.eval(feedback, deltaTime).apply(null, cmd.actionArguments);
              debug(`Circuit ${isOpen ? 'open' : 'closed'} after command evaluation`);

              return {evaluated: true};
            })
            // Keep actions that haven't yet been evaluated
            .filter(result => result.evaluated === false)
            // Unwrap back to original array
            .map(result => result.cmd);
      }

      // State after evaluating effects against latest feedback
      return isOpen;
    }
  };
};

module.exports = Showstopper;
