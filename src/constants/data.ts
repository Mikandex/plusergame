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

export default { depositMethod, withdrawMethod, gender, transactionType, transactionRemark }