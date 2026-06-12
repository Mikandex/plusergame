export type ticketGameType = {
  amount: number;
  draw_interval_minutes: number;
  id: string;
  max_winners: number;
  name: string;
  next_draw_at: string; // ISO date string
  potential_winning_amount: number;
  status: "active" | 'inactive',
  winning_percentage: number;
}

export type transactionsType = {
  amount: number; 
  category: string;
  currency: string; 
  customer_email: string; 
  id: string;
  paid_at: string;
  payment_method: string;
  payment_status: string; 
  payment_type: string;
  reference: string;
  transaction_reference: string;
  transaction_type: string;
}

export type leaderBoardType = {
  phone: string;
  amount: number;
  timestamp: string;
}