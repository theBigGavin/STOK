
const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8099/api/v1';
const TIMEOUT = 10000;

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 测试结果收集
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// 测试工具函数
function logTest(description, status, response = null, error = null) {
  testResults.total++;

  const result = {
    description,
    status,
    timestamp: new Date().toISOString()
  };

  if (response) {
    result.response = {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    };
  }

  if (error) {
    result.error = error.message || error;
  }

  testResults.details.push(result);

  if (status === 'PASSED') {
    testResults.passed++;
    console.log(`✅ ${description}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${description}`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
    }
  }
}

function validateResponse(response, expectedStatus = 200) {
  return response.status === expectedStatus &&
    response.data &&
    response.data.status === 'success';
}

// 验证决策统计数据结构
function validateDecisionStatsStructure(data) {
  const requiredFields = [
    'totalDecisions',
    'buyCount',
    'sellCount',
    'holdCount',
    'avgConfidence'
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined) {
      return false;
    }
  }

  // 验证数值类型
  if (typeof data.totalDecisions !== 'number' ||
    typeof data.buyCount !== 'number' ||
    typeof data.sellCount !== 'number' ||
    typeof data.holdCount !== 'number' ||
    typeof data.avgConfidence !== 'number') {
    return false;
  }

  return true;
}

// 测试场景1: 基础场景 - 不带任何参数
async function testBasicScenario() {
  try {
    console.log('\n📊 测试基础场景 - 不带任何参数...');

    const response = await api.get('/decisions/stats');

    if (validateResponse(response)) {
      const data = response.data.data;

      if (validateDecisionStatsStructure(data)) {
        logTest('GET /decisions/stats - 基础场景', 'PASSED', response);
        console.log(`   统计结果: 总计=${data.totalDecisions}, 买入=${data.buyCount}, 卖出=${data.sellCount}, 持有=${data.holdCount}, 平均置信度=${data.avgConfidence}`);
      } else {
        logTest('GET /decisions/stats - 基础场景数据结构验证', 'FAILED', response);
      }
    } else {
      logTest('GET /decisions/stats - 基础场景', 'FAILED', response);
    }

  } catch (error) {
    logTest('GET /decisions/stats - 基础场景', 'FAILED', null, error);
  }
}

// 测试场景2: 带symbol参数
async function testWithSymbol() {
  try {
    console.log('\n📈 测试带symbol参数...');

    // 测试有效股票代码
    const response = await api.get('/decisions/stats', {
      params: { symbol: '000001' }
    });

    if (validateResponse(response)) {
      const data = response.data.data;

      if (validateDecisionStatsStructure(data)) {
        logTest('GET /decisions/stats?symbol=000001 - 有效股票代码', 'PASSED', response);
        console.log(`   统计结果: 总计=${data.totalDecisions}, 买入=${data.buyCount}, 卖出=${data.sellCount}, 持有=${data.holdCount}`);
      } else {
        logTest('GET /decisions/stats?symbol=000001 - 数据结构验证', 'FAILED', response);
      }
    } else {
      logTest('GET /decisions/stats?symbol=000001 - 有效股票代码', 'FAILED', response);
    }

    // 测试无效股票代码
    try {
      await api.get('/decisions/stats', {
        params: { symbol: 'INVALID_SYMBOL' }
      });
      logTest('GET /decisions/stats?symbol=INVALID_SYMBOL - 无效股票代码', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 500) {
        logTest('GET /decisions/stats?symbol=INVALID_SYMBOL - 无效股票代码错误处理', 'PASSED');
      } else {
        logTest('GET /decisions/stats?symbol=INVALID_SYMBOL - 无效股票代码错误处理', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('GET /decisions/stats - 带symbol参数测试', 'FAILED', null, error);
  }
}

// 测试场景3: 带时间范围参数
async function testWithDateRange() {
  try {
    console.log('\n📅 测试带时间范围参数...');

    // 测试有效日期范围
    const response = await api.get('/decisions/stats', {
      params: {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      }
    });

    if (validateResponse(response)) {
      const data = response.data.data;

      if (validateDecisionStatsStructure(data)) {
        logTest('GET /decisions/stats?start_date=2024-01-01&end_date=2024-12-31 - 有效日期范围', 'PASSED', response);
        console.log(`   统计结果: 总计=${data.totalDecisions}, 平均置信度=${data.avgConfidence}`);
      } else {
        logTest('GET /decisions/stats?start_date=2024-01-01&end_date=2024-12-31 - 数据结构验证', 'FAILED', response);
      }
    } else {
      logTest('GET /decisions/stats?start_date=2024-01-01&end_date=2024-12-31 - 有效日期范围', 'FAILED', response);
    }

    // 测试无效日期格式
    try {
      await api.get('/decisions/stats', {
        params: {
          start_date: 'invalid-date',
          end_date: '2024-12-31'
        }
      });
      logTest('GET /decisions/stats?start_date=invalid-date - 无效日期格式', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 422) {
        logTest('GET /decisions/stats?start_date=invalid-date - 无效日期格式错误处理', 'PASSED');
      } else {
        logTest('GET /decisions/stats?start_date=invalid-date - 无效日期格式错误处理', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('GET /decisions/stats - 带时间范围参数测试', 'FAILED', null, error);
  }
}

// 测试场景4: 组合参数
async function testWithCombinedParams() {
  try {
    console.log('\n🔗 测试组合参数...');

    // 测试股票代码 + 日期范围
    const response = await api.get('/decisions/stats', {
      params: {
        symbol: '000001',
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      }
    });

    if (validateResponse(response)) {
      const data = response.data.data;

      if (validateDecisionStatsStructure(data)) {
        logTest('GET /decisions/stats?symbol=000001&start_date=2024-01-01&end_date=2024-12-31 - 组合参数', 'PASSED', response);
        console.log(`   统计结果: 总计=${data.totalDecisions}, 买入=${data.buyCount}, 卖出=${data.sellCount}, 持有=${data.holdCount}`);
      } else {
        logTest('GET /decisions/stats?symbol=000001&start_date=2024-01-01&end_date=2024-12-31 - 数据结构验证', 'FAILED', response);
      }
    } else {
      logTest('GET /decisions/stats?symbol=000001&start_date=2024-01-01&end_date=2024-12-31 - 组合参数', 'FAILED', response);
    }

    // 测试另一个股票代码
    const response2 = await api.get('/decisions/stats', {
      params: {
        symbol: '600036',
        start_date: '2024-01-01',
        end_date: '2024-06-30'
      }
    });

    if (validateResponse(response2)) {
      const data = response2.data.data;

      if (validateDecisionStatsStructure(data)) {
        logTest('GET /decisions/stats?symbol=600036&start_date=2024-01-01&end_date=2024-06-30 - 另一股票组合参数', 'PASSED', response2);
        console.log(`   统计结果: 总计=${data.totalDecisions}, 平均置信度=${data.avgConfidence}`);
      } else {
        logTest('GET /decisions/stats?symbol=600036&start_date=2024-01-01&end_date=2024-06-30 - 数据结构验证', 'FAILED', response2);
      }
    } else {
      logTest('GET /decisions/stats?symbol=600036&start_date=2024-01-01&end_date=2024-06-30 - 另一股票组合参数', 'FAILED', response2);
    }

  } catch (error) {
    logTest('GET /decisions/stats - 组合参数测试', 'FAILED', null, error);
  }
}

// 测试场景5: 边界情况和错误处理
async function testEdgeCases() {
  try {
    console.log('\n⚠️ 测试边界情况和错误处理...');

    // 测试空结果场景（很远的日期范围）
    try {
      const response = await api.get('/decisions/stats', {
        params: {
          start_date: '1900-01-01',
          end_date: '1900-12-31'
        }
      });

      if (validateResponse(response)) {
        const data = response.data.data;

        if (validateDecisionStatsStructure(data)) {
          logTest('GET /decisions/stats?start_date=1900-01-01&end_date=1900-12-31 - 空结果场景', 'PASSED', response);
          console.log(`   统计结果: 总计=${data.totalDecisions} (应为0)`);
        } else {
          logTest('GET /decisions/stats?start_date=1900-01-01&end_date=1900-12-31 - 数据结构验证', 'FAILED', response);
        }
      } else {
        logTest('GET /decisions/stats?start_date=1900-01-01&end_date=1900-12-31 - 空结果场景', 'FAILED', response);
      }
    } catch (error) {
      logTest('GET /decisions/stats?start_date=1900-01-01&end_date=1900-12-31 - 空结果场景', 'FAILED', null, error);
    }

    // 测试日期范围颠倒
    try {
      await api.get('/decisions/stats', {
        params: {
          start_date: '2024-12-31',
          end_date: '2024-01-01'
        }
      });
      logTest('GET /decisions/stats?start_date=2024-12-31&end_date=2024-01-01 - 日期范围颠倒', 'FAILED');
    } catch (error) {
      if (error.response && (error.response.status === 422 || error.response.status === 500)) {
        logTest('GET /decisions/stats?start_date=2024-12-31&end_date=2024-01-01 - 日期范围颠倒错误处理', 'PASSED');
      } else {
        logTest('GET /decisions/stats?start_date=2024-12-31&end_date=2024-01-01 - 日期范围颠倒错误处理', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('GET /decisions/stats - 边界情况测试', 'FAILED', null, error);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 决策统计接口测试报告');
  console.log('='.repeat(60));

  console.log(`\n测试统计:`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📊 总计: ${testResults.total}`);
  console.log(`🎯 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  console.log(`\n详细结果:`);
  testResults.details.forEach((test, index) => {
    const statusIcon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${index + 1}. ${statusIcon} ${test.description}`);
    if (test.error) {
      console.log(`   错误: ${test.error}`);
    }
    if (test.response && test.response.status !== 200) {
      console.log(`   响应状态: ${test.response.status} ${test.response.statusText}`);
    }
  });

  // 问题和建议
  const issues = [];
  const suggestions = [];

  if (testResults.failed > 0) {
    issues.push(`有 ${testResults.failed} 个测试用例失败`);
  }

  const failedTests = testResults.details.filter(test => test.status === 'FAILED');
  failedTests.forEach(test => {
    if (test.description.includes('数据结构验证')) {
      issues.push('决策统计数据结构不符合预期格式');
      suggestions.push('检查后端返回的数据结构是否与前端期望一致');
    }
