/**
 * Asserts that a card exists, is active, and is not expired.
 * INV-02: Reused across all card actions.
 */
const assertCardUsable = async (card) => {
  if (!card) {
    const error = new Error('Card not found');
    error.statusCode = 404;
    throw error;
  }

  if (card.status !== 'active') {
    const error = new Error(`Card is ${card.status}`);
    error.statusCode = 403;
    throw error;
  }

  if (new Date() > new Date(card.expiresAt)) {
    card.status = 'expired';
    await card.save();
    const error = new Error('Card has expired');
    error.statusCode = 403;
    throw error;
  }

  return card;
};

module.exports = assertCardUsable;

