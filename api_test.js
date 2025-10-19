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

// 测试函数
async function testHealthCheck() {
  try {
    console.log('\n🔍 测试健康检查API...');

    // 测试 /health
    const healthResponse = await api.get('/health');
    if (validateResponse(healthResponse)) {
      logTest('GET /health - 健康检查', 'PASSED', healthResponse);
    } else {
      logTest('GET /health - 健康检查', 'FAILED', healthResponse);
    }

    // 测试 /health/database
    const dbHealthResponse = await api.get('/health/database');
    if (validateResponse(dbHealthResponse)) {
      logTest('GET /health/database - 数据库健康检查', 'PASSED', dbHealthResponse);
    } else {
      logTest('GET /health/database - 数据库健康检查', 'FAILED', dbHealthResponse);
    }

    // 测试 /health/redis
    const redisHealthResponse = await api.get('/health/redis');
    if (validateResponse(redisHealthResponse)) {
      logTest('GET /health/redis - Redis健康检查', 'PASSED', redisHealthResponse);
    } else {
      logTest('GET /health/redis - Redis健康检查', 'FAILED', redisHealthResponse);
    }

    // 测试 /metrics
    const metricsResponse = await api.get('/metrics');
    if (validateResponse(metricsResponse)) {
      logTest('GET /metrics - 系统指标', 'PASSED', metricsResponse);
    } else {
      logTest('GET /metrics - 系统指标', 'FAILED', metricsResponse);
    }

  } catch (error) {
    logTest('健康检查API测试', 'FAILED', null, error);
  }
}

async function testStockAPIs() {
  try {
    console.log('\n📈 测试股票数据API...');

    // 测试 GET /stocks
    const stocksResponse = await api.get('/stocks', {
      params: { limit: 10, skip: 0 }
    });
    if (validateResponse(stocksResponse)) {
      logTest('GET /stocks - 获取股票列表', 'PASSED', stocksResponse);
    } else {
      logTest('GET /stocks - 获取股票列表', 'FAILED', stocksResponse);
    }

    // 测试无效股票代码
    try {
      await api.get('/stocks/INVALID_SYMBOL');
      logTest('GET /stocks/{invalid_symbol} - 无效股票代码', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('GET /stocks/{invalid_symbol} - 无效股票代码错误处理', 'PASSED');
      } else {
        logTest('GET /stocks/{invalid_symbol} - 无效股票代码错误处理', 'FAILED', null, error);
      }
    }

    // 测试股票历史数据（需要有效股票代码）
    try {
      const stockDataResponse = await api.get('/stocks/000001/data', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-10'
        }
      });
      if (validateResponse(stockDataResponse)) {
        logTest('GET /stocks/{symbol}/data - 股票历史数据', 'PASSED', stockDataResponse);
      } else {
        logTest('GET /stocks/{symbol}/data - 股票历史数据', 'FAILED', stockDataResponse);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('GET /stocks/{symbol}/data - 股票历史数据（无数据）', 'PASSED');
      } else {
        logTest('GET /stocks/{symbol}/data - 股票历史数据', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('股票数据API测试', 'FAILED', null, error);
  }
}

async function testModelAPIs() {
  try {
    console.log('\n🤖 测试模型管理API...');

    // 测试 GET /models
    const modelsResponse = await api.get('/models', {
      params: { limit: 5, skip: 0 }
    });
    if (validateResponse(modelsResponse)) {
      logTest('GET /models - 获取模型列表', 'PASSED', modelsResponse);
    } else {
      logTest('GET /models - 获取模型列表', 'FAILED', modelsResponse);
    }

    // 测试无效模型ID
    try {
      await api.get('/models/99999');
      logTest('GET /models/{invalid_id} - 无效模型ID', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('GET /models/{invalid_id} - 无效模型ID错误处理', 'PASSED');
      } else {
        logTest('GET /models/{invalid_id} - 无效模型ID错误处理', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('模型管理API测试', 'FAILED', null, error);
  }
}

async function testDecisionAPIs() {
  try {
    console.log('\n🎯 测试决策引擎API...');

    // 测试 GET /decisions
    const decisionsResponse = await api.get('/decisions', {
      params: { limit: 5, skip: 0 }
    });
    if (validateResponse(decisionsResponse)) {
      logTest('GET /decisions - 获取决策列表', 'PASSED', decisionsResponse);
    } else {
      logTest('GET /decisions - 获取决策列表', 'FAILED', decisionsResponse);
    }

    // 测试无效决策ID
    try {
      await api.get('/decisions/99999');
      logTest('GET /decisions/{invalid_id} - 无效决策ID', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('GET /decisions/{invalid_id} - 无效决策ID错误处理', 'PASSED');
      } else {
        logTest('GET /decisions/{invalid_id} - 无效决策ID错误处理', 'FAILED', null, error);
      }
    }

    // 测试刷新决策（需要有效数据）
    try {
      const refreshResponse = await api.post('/decisions/refresh');
      if (validateResponse(refreshResponse)) {
        logTest('POST /decisions/refresh - 刷新决策', 'PASSED', refreshResponse);
      } else {
        logTest('POST /decisions/refresh - 刷新决策', 'FAILED', refreshResponse);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('POST /decisions/refresh - 刷新决策（无数据）', 'PASSED');
      } else {
        logTest('POST /decisions/refresh - 刷新决策', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('决策引擎API测试', 'FAILED', null, error);
  }
}

async function testBacktestAPIs() {
  try {
    console.log('\n📊 测试回测功能API...');

    // 测试回测请求
    try {
      const backtestRequest = {
        symbol: "000001",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        initial_capital: 100000,
        model_ids: [1, 2, 3]
      };
      const backtestResponse = await api.post('/backtest/run', backtestRequest);
      if (validateResponse(backtestResponse)) {
        logTest('POST /backtest/run - 运行回测', 'PASSED', backtestResponse);
      } else {
        logTest('POST /backtest/run - 运行回测', 'FAILED', backtestResponse);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('POST /backtest/run - 运行回测（无数据）', 'PASSED');
      } else {
        logTest('POST /backtest/run - 运行回测', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('回测功能API测试', 'FAILED', null, error);
  }
}

async function testErrorHandling() {
  try {
    console.log('\n🛡️ 测试错误处理...');

    // 测试无效端点
    try {
      await api.get('/invalid-endpoint');
      logTest('GET /invalid-endpoint - 无效端点', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logTest('GET /invalid-endpoint - 无效端点错误处理', 'PASSED');
      } else {
        logTest('GET /invalid-endpoint - 无效端点错误处理', 'FAILED', null, error);
      }
    }

    // 测试无效参数
    try {
      await api.get('/stocks', { params: { limit: -1 } });
      logTest('GET /stocks with invalid limit - 无效参数', 'FAILED');
    } catch (error) {
      if (error.response && error.response.status === 422) {
        logTest('GET /stocks with invalid limit - 无效参数错误处理', 'PASSED');
      } else {
        logTest('GET /stocks with invalid limit - 无效参数错误处理', 'FAILED', null, error);
      }
    }

  } catch (error) {
    logTest('错误处理测试', 'FAILED', null, error);
  }
}

// 生成测试报告
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 STOK后端API测试报告');
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
    if (test.description.includes('无数据')) {
      suggestions.push('建议添加测试数据以完善测试覆盖');
    }
    if (test.error && test.error.includes('timeout')) {
      suggestions.push('建议优化API响应时间或增加超时设置');
    }
    if (test.error && test.error.includes('ECONNREFUSED')) {
      issues.push('后端服务连接失败，请确保服务正在运行在localhost:8099');
    }
  });

  if (issues.length > 0) {
    console.log(`\n⚠️ 发现的问题:`);
    issues.forEach(issue => console.log(`   • ${issue}`));
  }

  if (suggestions.length > 0) {
    console.log(`\n💡 改进建议:`);
    suggestions.forEach(suggestion => console.log(`   • ${suggestion}`));
  }

  console.log('\n' + '='.repeat(60));
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始STOK后端API全面测试...');
  console.log(`目标服务: ${BASE_URL}`);
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  try {
    // 执行所有测试
    await testHealthCheck();
    await testStockAPIs();
    await testModelAPIs();
    await testDecisionAPIs();
    await testBacktestAPIs();
    await testErrorHandling();

    // 生成报告
    generateReport();

    // 返回测试结果
    return testResults.passed === testResults.total;

  } catch (error) {
    console.error('测试执行过程中发生错误:', error);
    generateReport();
    return false;
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  runAllTests,
  testResults
};