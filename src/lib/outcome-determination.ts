import { logger } from './logger';
import type { Market } from '../types/market';
import type { WinnerEnum } from '../types/database';

interface OutcomeAnalysis {
  readonly winner: WinnerEnum;
  readonly confidence: number;
  readonly reason: string;
  readonly price1: number;
  readonly price2: number;
}

const OUTCOME_THRESHOLDS = {
  WINNING_THRESHOLD: 0.95,  // Price > 0.95 indicates winning outcome
  LOSING_THRESHOLD: 0.05,   // Price < 0.05 indicates losing outcome
  DRAW_THRESHOLD: 0.45,     // Prices between 0.45-0.55 might indicate draw
  DRAW_UPPER: 0.55
} as const;

const createUnresolvedAnalysis = (reason: string, price1 = 0, price2 = 0): OutcomeAnalysis => ({
  winner: 'UNRESOLVED',
  confidence: 0,
  reason,
  price1,
  price2
});

const createOutcomeAnalysis = (
  winner: WinnerEnum,
  confidence: number,
  reason: string,
  price1: number,
  price2: number
): OutcomeAnalysis => ({
  winner,
  confidence,
  reason,
  price1,
  price2
});

const parseMarketPrices = (outcomePrices: string): readonly [number, number] => {
  try {
    const prices = outcomePrices ? JSON.parse(outcomePrices) : ['0.5', '0.5'];
    const price1 = parseFloat(prices[0] || '0.5');
    const price2 = parseFloat(prices[1] || '0.5');

    return [
      Math.max(0, Math.min(1, price1)),
      Math.max(0, Math.min(1, price2))
    ];
  } catch {
    return [0.5, 0.5];
  }
};

const isValidPrices = (price1: number, price2: number): boolean =>
  !isNaN(price1) && !isNaN(price2);

const isHighConfidenceOutcome1 = (price1: number, price2: number): boolean =>
  price1 >= OUTCOME_THRESHOLDS.WINNING_THRESHOLD && price2 <= OUTCOME_THRESHOLDS.LOSING_THRESHOLD;

const isHighConfidenceOutcome2 = (price1: number, price2: number): boolean =>
  price2 >= OUTCOME_THRESHOLDS.WINNING_THRESHOLD && price1 <= OUTCOME_THRESHOLDS.LOSING_THRESHOLD;

const isDraw = (price1: number, price2: number): boolean =>
  price1 >= OUTCOME_THRESHOLDS.DRAW_THRESHOLD &&
  price1 <= OUTCOME_THRESHOLDS.DRAW_UPPER &&
  price2 >= OUTCOME_THRESHOLDS.DRAW_THRESHOLD &&
  price2 <= OUTCOME_THRESHOLDS.DRAW_UPPER;

const isModerateDifference = (diff: number): boolean => diff > 0.1;

const analyzeOutcomeFromPrices = (price1: number, price2: number): OutcomeAnalysis => {
  const formatPrice = (p: number) => p.toFixed(3);

  if (isHighConfidenceOutcome1(price1, price2)) {
    return createOutcomeAnalysis(
      'OUTCOME1',
      Math.min(price1, 1 - price2),
      `Outcome1 won with high confidence (${formatPrice(price1)} vs ${formatPrice(price2)})`,
      price1,
      price2
    );
  }

  if (isHighConfidenceOutcome2(price1, price2)) {
    return createOutcomeAnalysis(
      'OUTCOME2',
      Math.min(price2, 1 - price1),
      `Outcome2 won with high confidence (${formatPrice(price2)} vs ${formatPrice(price1)})`,
      price1,
      price2
    );
  }

  if (isDraw(price1, price2)) {
    return createOutcomeAnalysis(
      'DRAW',
      1 - Math.abs(price1 - price2),
      `Draw detected - prices are balanced (${formatPrice(price1)} vs ${formatPrice(price2)})`,
      price1,
      price2
    );
  }

  const diff1 = price1 - price2;
  const diff2 = price2 - price1;

  if (isModerateDifference(diff1)) {
    return createOutcomeAnalysis(
      'OUTCOME1',
      diff1,
      `Outcome1 likely won with moderate confidence (${formatPrice(price1)} vs ${formatPrice(price2)})`,
      price1,
      price2
    );
  }

  if (isModerateDifference(diff2)) {
    return createOutcomeAnalysis(
      'OUTCOME2',
      diff2,
      `Outcome2 likely won with moderate confidence (${formatPrice(price2)} vs ${formatPrice(price1)})`,
      price1,
      price2
    );
  }

  return createUnresolvedAnalysis(
    `Outcome unclear - prices too close (${formatPrice(price1)} vs ${formatPrice(price2)})`,
    price1,
    price2
  );
};

const determineOutcome = (market: Market): OutcomeAnalysis => {
  if (!market.closed) {
    return createUnresolvedAnalysis('Market is still active');
  }

  const [price1, price2] = parseMarketPrices(market.outcomePrices);

  if (!isValidPrices(price1, price2)) {
    return createUnresolvedAnalysis('Invalid price data');
  }

  return analyzeOutcomeFromPrices(price1, price2);
};

const createLogData = (market: Market, analysis: OutcomeAnalysis) => ({
  marketId: market.id,
  question: market.question,
  closed: market.closed,
  winner: analysis.winner,
  confidence: analysis.confidence.toFixed(3),
  reason: analysis.reason,
  prices: {
    outcome1: analysis.price1.toFixed(3),
    outcome2: analysis.price2.toFixed(3)
  },
  outcomes: {
    outcome1: market.outcomes ? JSON.parse(market.outcomes)[0] : 'Yes',
    outcome2: market.outcomes ? JSON.parse(market.outcomes)[1] : 'No'
  }
});

const logOutcomeDecision = (market: Market, analysis: OutcomeAnalysis): void => {
  const logData = createLogData(market, analysis);

  const logAction = analysis.winner !== 'UNRESOLVED'
    ? () => logger.info('Market outcome determined', logData)
    : () => logger.debug('Market remains unresolved', logData);

  logAction();
};

const getMarketWinner = (market: Market): WinnerEnum => {
  const analysis = determineOutcome(market);

  if (market.closed) {
    logOutcomeDecision(market, analysis);
  }

  return analysis.winner;
};

export {
  determineOutcome,
  logOutcomeDecision,
  getMarketWinner,
  OUTCOME_THRESHOLDS
};

export type { OutcomeAnalysis };