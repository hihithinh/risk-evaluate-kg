/**
 * Basic API Tests
 * Test xem các endpoints có hoạt động không
 */

const BASE_URL = 'http://localhost:3000/api';

async function testHealthCheck() {
  console.log('\n🧪 Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data.status);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testKnowledgeAPI() {
  console.log('\n🧪 Testing Knowledge Management API...');
  
  try {
    // Test get rule types
    const typesRes = await fetch(`${BASE_URL}/knowledge/types`);
    const types = await typesRes.json();
    console.log('✅ Get rule types:', types.data);
    
    // Test get knowledge graph
    const graphRes = await fetch(`${BASE_URL}/knowledge/graph`);
    const graph = await graphRes.json();
    console.log('✅ Get knowledge graph:', graph.data.metadata);
    
    // Test get risk signal rules
    const rulesRes = await fetch(`${BASE_URL}/knowledge/rules/indicator`);
    const rules = await rulesRes.json();
    console.log('✅ Get risk signal rules:', rules.data.isCustom ? 'Custom' : 'Default');
    
    return true;
  } catch (error) {
    console.error('❌ Knowledge API failed:', error.message);
    return false;
  }
}

async function testEvaluationAPI() {
  console.log('\n🧪 Testing Single Evaluation API...');
  
  try {
    // Test get tickers
    const tickersRes = await fetch(`${BASE_URL}/evaluation/tickers`);
    const tickers = await tickersRes.json();
    console.log('✅ Get tickers:', tickers.data.length, 'tickers');
    
    // Test get current period
    const periodRes = await fetch(`${BASE_URL}/evaluation/current-period`);
    const period = await periodRes.json();
    console.log('✅ Get current period:', period.data);
    
    // Test evaluate (this will take time, skip for basic test)
    console.log('⏭️  Skipping actual evaluation (takes too long)');
    
    return true;
  } catch (error) {
    console.error('❌ Evaluation API failed:', error.message);
    return false;
  }
}

async function testBulkAPI() {
  console.log('\n🧪 Testing Bulk Evaluation API...');
  
  try {
    // Test get template
    const templateRes = await fetch(`${BASE_URL}/bulk/template`);
    const template = await templateRes.json();
    console.log('✅ Get template:', template.data.filename);
    
    return true;
  } catch (error) {
    console.error('❌ Bulk API failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 Starting API Tests');
  console.log('='.repeat(60));
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testKnowledgeAPI());
  results.push(await testEvaluationAPI());
  results.push(await testBulkAPI());
  
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`📊 Results: ${passed}/${total} tests passed`);
  console.log('='.repeat(60));
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runAllTests();
