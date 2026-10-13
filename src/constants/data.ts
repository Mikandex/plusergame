import images from './images';

const depositMethod = [
  { label: 'Airtime', value: 'airtime' },
  { label: 'Cash', value: 'cash' }
];

const withdrawMethod = [
  { label: 'Data', value: 'data' },
  { label: 'Airtime', value: 'airtime' },
  { label: 'Cash', value: 'cash' }
];

const gender = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Others', value: 'others' }
];

const transactionType = [
  {title: 'Top Up', value: 'topup'},
  {title: 'Bonus', value: 'bonus'},
  {title: 'Profit', value: 'profit'},
  {title: 'Payout', value: 'payout'}
];

const transactionRemark = [
  { title: 'Pending', value: 'pending' },
  { title: 'Successful', value: 'successful' },
  { title: 'Failed', value: 'failed' },    
  { title: 'Reversed', value: 'reversed' },
  { title: 'Rejected', value: 'rejected' }
];

export type GameKey = 'coin' | 'dice' | 'hotcold' | 'lottery' | 'luckybox' | 'rpsbet' | 'card' | 'spinwheel' | 'reelstreak';

export type GameDetail = {
  title: string;
  route: string;
  image: any;
  minStake: number;
  maxStake: number;
  defaultMultiplier: string;
  chancesPerPlay: number;
  rewardSummary: string;
  description: string;
};

export const GAME_DETAILS: Record<GameKey, GameDetail> = {
  coin: {
    title: 'Coin',
    route: 'Coin',
    image: images.coinPlaceholder,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '3x',
    chancesPerPlay: 1,
    rewardSummary: 'Call heads or tails correctly and win 3x your stake.',
    description: 'A classic toss with a single decision. Pick a side, set your stake and watch the coin fly. Every flip is settled instantly, so you always know where you stand.',
  },
  dice: {
    title: 'Dice',
    route: 'Dice',
    image: images.dice,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '2.5x',
    chancesPerPlay: 1,
    rewardSummary: 'Win 2.5x on a correct call, or 5x when you hit the exact number.',
    description: 'Choose how you want to bet before the dice leave your hand. Go for a safer range or call the exact number for the biggest payout. Each roll is a fresh chance to win.',
  },
  hotcold: {
    title: 'Hot Cold',
    route: 'HotCold',
    image: images.hotCold,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: 'up to 10x',
    chancesPerPlay: 1,
    rewardSummary: 'Guess the hidden number and win up to 10x your stake.',
    description: 'Pick a number from the range you choose and see how close you get. Wider ranges are harder to crack but pay more when you land it.',
  },
  lottery: {
    title: 'Lottery',
    route: 'Lottery',
    image: images.lottery,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '3x',
    chancesPerPlay: 1,
    rewardSummary: 'Match the drawn numbers to win 3x your stake.',
    description: 'Select your lucky numbers and wait for the draw. The more of your picks that match, the closer you get to the prize.',
  },
  luckybox: {
    title: 'Lucky Box',
    route: 'LuckyBox',
    image: images.box,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '2.5x',
    chancesPerPlay: 1,
    rewardSummary: 'Open the right box and win 2.5x your stake.',
    description: 'Several boxes, one prize. Trust your instinct, pick a box and find out what is inside. Each round starts with fresh boxes.',
  },
  rpsbet: {
    title: 'RPS Bet',
    route: 'RPSBet',
    image: images.betting,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '5x',
    chancesPerPlay: 1,
    rewardSummary: 'Beat the AI to win 5x your stake. A draw returns your stake.',
    description: 'Rock, paper, scissors against the machine with real stakes. Make your move, and if the round ends in a draw your stake comes straight back.',
  },
  card: {
    title: 'Card',
    route: 'Card',
    image: images.card,
    minStake: 50,
    maxStake: 1000,
    defaultMultiplier: '2x',
    chancesPerPlay: 1,
    rewardSummary: 'Guess higher or lower correctly and win 2x your stake.',
    description: 'A card is dealt face up and you decide whether the next one will be higher or lower. One correct call doubles your stake.',
  },
  spinwheel: {
    title: 'Spin 2 Win',
    route: 'SpinWheel',
    image: images.spinToWin,
    minStake: 50,
    maxStake: 500,
    defaultMultiplier: '2x',
    chancesPerPlay: 1,
    rewardSummary: 'Land on a winning segment to collect 2x your stake.',
    description: 'Set your stake and spin the wheel. Each segment carries its own multiplier, so every spin is a new shot at a payout.',
  },
  reelstreak: {
    title: 'Reel Streak',
    route: 'ReelStreak',
    image: images.fruit,
    minStake: 50,
    maxStake: 500,
    defaultMultiplier: '15x',
    chancesPerPlay: 1,
    rewardSummary: 'Line up matching reels to win up to 15x your stake.',
    description: 'Pull the lever and let the reels settle. Matching symbols build your streak and the payout grows with every match.',
  },
};

// TODO: replace with real production URLs before release
export const SUPPORT_LINKS = {
  faqUrl: 'https://plusergame.com/faq',
  tutorialVideoUrl: 'https://plusergame.com/tutorial',
  supportPhone: '+2348000000000',
  supportEmail: 'support@plusergame.com',
  social: {
    facebook: 'https://facebook.com/plusergame',
    instagram: 'https://instagram.com/plusergame',
    x: 'https://x.com/plusergame',
    linkedin: 'https://linkedin.com/company/plusergame',
    tiktok: 'https://tiktok.com/@plusergame',
  },
};

export default { depositMethod, withdrawMethod, gender, transactionType, transactionRemark }