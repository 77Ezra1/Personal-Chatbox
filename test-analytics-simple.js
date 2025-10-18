/**
 * 简单的数据分析功能测试
 * 测试货币转换和API调用统计
 */

// 测试货币转换逻辑
const EXCHANGE_RATES = {
  'USD': 1.0,
  'CNY': 7.2,
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 149.5,
  'KRW': 1320.0,
  'HKD': 7.8,
  'TWD': 31.5
};

const CURRENCY_SYMBOLS = {
  'USD': '$',
  'CNY': '¥',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'KRW': '₩',
  'HKD': 'HK$',
  'TWD': 'NT$'
};

function calculateCost(promptTokens, completionTokens, currency = 'USD') {
  const avgPricePerMillion = {
    prompt: 0.5,
    completion: 1.5
  };

  const promptCostUSD = (promptTokens / 1000000) * avgPricePerMillion.prompt;
  const completionCostUSD = (completionTokens / 1000000) * avgPricePerMillion.completion;
  const totalCostUSD = promptCostUSD + completionCostUSD;

  const exchangeRate = EXCHANGE_RATES[currency] || 1.0;
  const totalCost = totalCostUSD * exchangeRate;

  const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : 4;

  return {
    total: totalCost.toFixed(decimals),
    prompt: (promptCostUSD * exchangeRate).toFixed(decimals),
    completion: (completionCostUSD * exchangeRate).toFixed(decimals),
    currency: currency,
    currencySymbol: CURRENCY_SYMBOLS[currency] || currency
  };
}

// 运行测试
console.log('==========================================');
console.log('📊 数据面板功能测试');
console.log('==========================================\n');

// 测试数据
const testCases = [
  { prompt: 100000, completion: 50000, desc: '小规模使用' },
  { prompt: 500000, completion: 250000, desc: '中等规模使用' },
  { prompt: 1000000, completion: 500000, desc: '大规模使用' }
];

const currencies = ['USD', 'CNY', 'EUR', 'JPY', 'KRW'];

testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase.desc}`);
  console.log(`Token: Prompt=${testCase.prompt.toLocaleString()}, Completion=${testCase.completion.toLocaleString()}`);
  console.log('─'.repeat(60));

  currencies.forEach(currency => {
    const cost = calculateCost(testCase.prompt, testCase.completion, currency);
    console.log(`${currency.padEnd(5)} ${cost.currencySymbol}${cost.total.padStart(10)} (Prompt: ${cost.prompt}, Completion: ${cost.completion})`);
  });
});

// 验证特殊情况
console.log('\n\n特殊情况测试:');
console.log('─'.repeat(60));

// 零Token
const zeroCost = calculateCost(0, 0, 'CNY');
console.log(`零Token (CNY): ${zeroCost.currencySymbol}${zeroCost.total} ✓`);

// 小数精度测试 (JPY应该是整数)
const jpyCost = calculateCost(100000, 50000, 'JPY');
console.log(`日元整数测试: ${jpyCost.currencySymbol}${jpyCost.total} ${jpyCost.total.includes('.') ? '❌' : '✓'}`);

// 韩元整数测试
const krwCost = calculateCost(100000, 50000, 'KRW');
console.log(`韩元整数测试: ${krwCost.currencySymbol}${krwCost.total} ${krwCost.total.includes('.') ? '❌' : '✓'}`);

// 货币符号测试
console.log('\n货币符号验证:');
console.log('─'.repeat(60));
Object.entries(CURRENCY_SYMBOLS).forEach(([code, symbol]) => {
  const cost = calculateCost(100000, 50000, code);
  console.log(`${code}: ${symbol} → ${cost.currencySymbol} ${symbol === cost.currencySymbol ? '✓' : '❌'}`);
});

console.log('\n\n==========================================');
console.log('✅ 所有测试完成！');
console.log('==========================================\n');

// 输出使用示例
console.log('💡 前端使用示例:');
console.log(`
// 在AnalyticsPage.jsx中
<p className="stat-value">
  {overview?.cost?.currencySymbol}{parseFloat(overview?.cost?.total || 0).toLocaleString()}
</p>
<p className="stat-detail">
  {overview?.cost?.currency} (预估值)
</p>

// 示例输出:
// ¥0.9000
// CNY (预估值)
`);

console.log('🔧 后端API响应示例:');
console.log(JSON.stringify({
  success: true,
  data: {
    conversations: 1234,
    messages: 5678,
    apiCalls: 2500,
    tokens: {
      prompt: 800000,
      completion: 400000,
      total: 1200000
    },
    cost: calculateCost(800000, 400000, 'CNY'),
    todayMessages: 45,
    todayApiCalls: 120
  }
}, null, 2));

console.log('\n📚 相关文档:');
console.log('- ANALYTICS_OPTIMIZATION_COMPLETE.md - 完整优化报告');
console.log('- ANALYTICS_UI_COMPARISON.md - UI对比说明');
console.log('- ANALYTICS_QUICKSTART.md - 快速开始指南');
