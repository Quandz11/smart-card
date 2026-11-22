const IdempotencyKey = require('../models/IdempotencyKey');

/**
 * Wraps an action function with a 24-hour idempotency guarantee.
 * Supports both signatures:
 *   withIdempotency(key, actionFn)
 *   withIdempotency(key, userId, endpoint, actionFn)
 */
async function withIdempotency(key, userOrActionFn, endpointOrFn, maybeActionFn) {
  let userId = null;
  let endpoint = 'mutation';
  let actionFn = null;

  if (typeof userOrActionFn === 'function') {
    actionFn = userOrActionFn;
  } else {
    userId = userOrActionFn;
    if (typeof endpointOrFn === 'function') {
      actionFn = endpointOrFn;
    } else {
      endpoint = endpointOrFn || 'mutation';
      actionFn = maybeActionFn;
    }
  }

  if (!key || typeof key !== 'string') {
    return await actionFn();
  }

  const trimmedKey = key.trim();
  const query = { key: trimmedKey };
  if (userId) {
    query.user = userId;
  }

  const existing = await IdempotencyKey.findOne(query);
  if (existing) {
    return existing.responseBody;
  }

  const result = await actionFn();

  try {
    const doc = {
      key: trimmedKey,
      endpoint,
      responseStatus: 200,
      responseBody: result,
    };
    if (userId) {
      doc.user = userId;
    }
    await IdempotencyKey.create(doc);
  } catch (err) {
    // If a concurrent insert occurred, return existing if possible
    const concurrent = await IdempotencyKey.findOne(query);
    if (concurrent) {
      return concurrent.responseBody;
    }
  }

  return result;
}

module.exports = { withIdempotency };
