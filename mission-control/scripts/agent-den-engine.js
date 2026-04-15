(function (global) {
  'use strict';

  function sum(values) {
    return values.reduce(function (total, value) {
      return total + value;
    }, 0);
  }

  function normalizeTopicType(type) {
    return type === 'social' ? 'social' : 'work';
  }

  function buildScoreDetails(signals, weights) {
    return signals.map(function (signal) {
      return {
        signal: signal,
        weight: typeof weights[signal] === 'number' ? weights[signal] : 0,
      };
    });
  }

  function scoreSignals(signals, weights) {
    return sum(
      buildScoreDetails(signals, weights).map(function (detail) {
        return detail.weight;
      })
    );
  }

  function countOpenTopics(topics) {
    return (topics || []).filter(function (topic) {
      return topic && topic.state !== 'closed';
    }).length;
  }

  function getReusableTopic(request, topics) {
    return (topics || []).find(function (topic) {
      return (
        topic &&
        topic.state !== 'closed' &&
        topic.type === request.topicType &&
        topic.purpose === request.purpose
      );
    }) || null;
  }

  function getClosableTopic(topics) {
    var closableStates = ['dormant', 'open', 'active'];
    return (topics || []).find(function (topic) {
      return topic && closableStates.indexOf(topic.state) !== -1;
    }) || null;
  }

  function evaluateRequest(runtime, request, currentTopics) {
    var safeRuntime = runtime || {};
    var thresholds = safeRuntime.decisionThresholds || {};
    var weights = safeRuntime.weights || {};
    var defaults = safeRuntime.defaults || {};
    var limits = safeRuntime.limits || {};
    var topicType = normalizeTopicType(request.topicType);
    var signals = Array.isArray(request.signals) ? request.signals : [];
    var scoreDetails = buildScoreDetails(signals, weights);
    var score = scoreSignals(signals, weights);
    var openTopics = countOpenTopics(currentTopics);
    var reusableTopic = getReusableTopic(request, currentTopics);
    var closableTopic = getClosableTopic(currentTopics);
    var maxOpenTopics = typeof limits.maxOpenTopics === 'number' ? limits.maxOpenTopics : 5;
    var shortExchangeMax = typeof thresholds.shortExchangeMaxMessages === 'number' ? thresholds.shortExchangeMaxMessages : 3;
    var shouldStayInMainChat =
      defaults.preferMainChatForShortExchanges !== false &&
      typeof request.messageCount === 'number' &&
      request.messageCount <= shortExchangeMax &&
      signals.indexOf('cluttering_main_chat') === -1 &&
      signals.indexOf('ongoing_discussion') === -1;

    if (reusableTopic) {
      return {
        action: 'reuse_topic',
        reason: 'A matching active topic already exists.',
        topicId: reusableTopic.id,
        score: score,
        scoreDetails: scoreDetails,
        openTopics: openTopics,
      };
    }

    if (shouldStayInMainChat && score < (thresholds.promoteToTopicScore || 3)) {
      return {
        action: 'stay_in_main_chat',
        reason: 'This looks like a short exchange that does not need a dedicated room yet.',
        score: score,
        scoreDetails: scoreDetails,
        openTopics: openTopics,
      };
    }

    if (openTopics >= maxOpenTopics) {
      if (closableTopic && defaults.autoCloseStaleTopicsFirst !== false) {
        return {
          action: 'close_then_create_topic',
          reason: 'Topic limit reached. Close a lower-value or stale topic before creating a new one.',
          closeTopicId: closableTopic.id,
          score: score,
          scoreDetails: scoreDetails,
          openTopics: openTopics,
        };
      }

      return {
        action: 'stay_in_main_chat',
        reason: 'Topic limit reached and no closable topic was identified.',
        score: score,
        scoreDetails: scoreDetails,
        openTopics: openTopics,
      };
    }

    if (score >= (thresholds.promoteToTopicScore || 3)) {
      return {
        action: 'create_topic',
        reason: 'Signals indicate this discussion would benefit from a dedicated topic.',
        score: score,
        scoreDetails: scoreDetails,
        openTopics: openTopics,
        suggestedTopic: {
          type: topicType,
          title: request.title || 'Untitled Topic',
          purpose: request.purpose || 'coordination',
          ownerRequired: topicType === 'work',
        },
      };
    }

    return {
      action: 'stay_in_main_chat',
      reason: 'The discussion does not yet justify a separate topic.',
      score: score,
      scoreDetails: scoreDetails,
      openTopics: openTopics,
    };
  }

  global.AgentDenEngine = {
    evaluateRequest: evaluateRequest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
