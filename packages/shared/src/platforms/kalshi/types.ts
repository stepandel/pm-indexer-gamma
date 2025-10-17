export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle: string;
  yes_sub_title: string;
  no_sub_title: string;
  open_time: string;
  close_time: string;
  expected_expiration_time: string;
  expiration_time: string;
  latest_expiration_time: string;
  settlement_timer_seconds: number;
  status: string;
  response_price_units: string;
  notional_value: number;
  notional_value_dollars: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  previous_price: number;
  previous_yes_bid: number;
  previous_yes_ask: number;
  previous_no_bid: number;
  previous_no_ask: number;
  volume: number;
  liquidity: number;
  liquidity_dollars: string;
  open_interest: number;
  rules_primary: string;
  can_close_early: boolean;
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  sub_title: string;
  title: string;
  collateral_return_type: string;
  mutually_exclusive: boolean;
  category: string;
  markets: KalshiMarket[];
  price_level_structure: string;
  available_on_brokers: boolean;
}

export interface KalshiApiResponse {
  events: KalshiEvent[];
  cursor?: string;
}