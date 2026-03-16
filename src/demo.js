/**
 * Demo script cho Knowledge Inference Engine (Node.js version)
 * Chạy: node demo.js
 */

import { ForwardChainer } from './core/ForwardChainer.js';
import { BackwardChainer } from './core/BackwardChainer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock evaluations data (giống kết quả từ Phase 3)
const mockEvaluations = {
  'A1': {
    value: 1.2,
    risk_level: 'Medium',
    risk_point: 1,
    risk_type: 'liquidity_risk',
    explanation: 'Tỷ lệ thanh toán hiện hành ở mức trung bình'
  },
  'A2': {
    value: 0.8,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'liquidity_risk',
    explanation: 'Tỷ lệ thanh toán nhanh thấp, có nguy cơ thanh khoản'
  },
  'A3': {
    value: 0.15,
    risk_level: 'Medium',
    risk_point: 1,
    risk_type: 'liquidity_risk',
    explanation: 'Tỷ lệ tiền mặt ở mức trung bình'
  },
  'B1': {
    value: 0.75,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'leverage_risk',
    explanation: 'Tỷ lệ nợ trên tổng tài sản cao, rủi ro đòn bẩy'
  },
  'B2': {
    value: 2.5,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'leverage_risk',
    explanation: 'Tỷ lệ nợ trên vốn chủ sở hữu cao'
  },
  'B3': {
    value: 1.8,
    risk_level: 'Medium',
    risk_point: 1,
    risk_type: 'leverage_risk',
    explanation: 'Khả năng thanh toán lãi vay ở mức trung bình'
  },
  'C1': {
    value: 45,
    risk_level: 'Medium',
    risk_point: 1,
    risk_type: 'efficiency_risk',
    explanation: 'Vòng quay hàng tồn kho ở mức trung bình'
  },
  'C2': {
    value: 60,
    risk_level: 'Good',
    risk_point: 0,
    risk_type: 'efficiency_risk',
    explanation: 'Vòng quay khoản phải thu tốt'
  },
  'C3': {
    value: 1.2,
    risk_level: 'Good',
    risk_point: 0,
    risk_type: 'efficiency_risk',
    explanation: 'Vòng quay tổng tài sản tốt'
  },
  'D1': {
    value: 0.03,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'profitability_risk',
    explanation: 'Tỷ suất lợi nhuận gộp thấp'
  },
  'D2': {
    value: 0.02,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'profitability_risk',
    explanation: 'Tỷ suất lợi nhuận hoạt động thấp'
  },
  'D3': {
    value: 0.01,
    risk_level: 'High',
    risk_point: 2,
    risk_type: 'profitability_risk',
    explanation: 'ROE thấp, khả năng sinh lời kém'
  }
};

function printSeparator(title = '') {
  console.log('\n' + '='.repeat(80));
  if (title) {
    console.log(title);
    console.log('='.repeat(80));
  }
}

function demoForwardChaining() {
  printSeparator('DEMO 1: FORWARD CHAINING - DATA-DRIVEN REASONING');
  
  console.log('\nMô tả:');
  console.log('- Bắt đầu từ dữ liệu (initial facts)');
  console.log('- Tìm rules có thể kích hoạt');
  console.log('- Chọn rule tốt nhất (conflict resolution)');
  console.log('- Kích hoạt rule → tạo facts mới');
  console.log('- Lặp lại cho đến khi không còn rules nào');
  
  const rulesPath = path.join(__dirname, '../rules/composite_rules.json');
  
  try {
    const forwardChainer = new ForwardChainer(rulesPath);
    
    const result = forwardChainer.inferenceLoop(mockEvaluations);
    
    printSeparator('KẾT QUẢ FORWARD CHAINING');
    
    console.log('\nInference Statistics:');
    console.log(`  - Iterations: ${result.inference_stats.iterations}`);
    console.log(`  - Rules fired: ${result.inference_stats.rules_fired}`);
    console.log(`  - Total facts: ${result.inference_stats.total_facts}`);
    console.log(`  - Composite risks found: ${result.inference_stats.composite_risks_count}`);
    
    console.log('\nFinal Risk Score:');
    console.log(`  - Risk Score: ${(result.final_score.risk_score * 100).toFixed(2)}%`);
    console.log(`  - Risk Level: ${result.final_score.risk_level}`);
    console.log(`  - Total Points: ${result.final_score.total_risk_points}/${result.final_score.max_total_points}`);
    
    if (result.composite_risks.length > 0) {
      console.log('\nComposite Risks Detected:');
      for (const risk of result.composite_risks) {
        console.log(`  - [${risk.rule_id}] ${risk.risk_type} (${risk.severity})`);
        console.log(`    ${risk.explanation}`);
      }
    }
    
    if (result.inference_trace.length > 0) {
      console.log('\nInference Trace:');
      for (const step of result.inference_trace) {
        console.log(`  Step ${step.stepId + 1}: ${step.ruleId} - ${step.ruleDescription}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nLưu ý: Cần có file composite_rules.json tại:');
    console.error(rulesPath);
  }
}

function demoBackwardChaining() {
  printSeparator('DEMO 2: BACKWARD CHAINING - GOAL-DRIVEN REASONING');
  
  console.log('\nMô tả:');
  console.log('- Bắt đầu từ goal (mục tiêu)');
  console.log('- Tìm rules có thể suy ra goal');
  console.log('- Đệ quy chứng minh các điều kiện');
  console.log('- Trả về proof chain nếu thành công');
  
  const rulesPath = path.join(__dirname, '../rules/composite_rules.json');
  
  try {
    const backwardChainer = new BackwardChainer(rulesPath);
    
    printSeparator('BACKWARD CHAINING QUERIES');
    
    // Query 1: Tại sao có rủi ro cao?
    console.log('\nQuery 1: Tại sao công ty này có rủi ro cao?');
    console.log('-'.repeat(80));
    
    const whyHighRisk = backwardChainer.queryWhyHighRisk(mockEvaluations);
    
    if (whyHighRisk.success) {
      console.log('✓ Tìm thấy bằng chứng!');
      console.log(`\nRules sử dụng: ${whyHighRisk.rules_used.join(', ')}`);
      console.log(`\n${whyHighRisk.explanation}`);
    } else {
      console.log('✗ Không tìm thấy bằng chứng cho rủi ro cao');
    }
    
    // Query 2: Có rủi ro financial_distress không?
    console.log('\n' + '-'.repeat(80));
    console.log('Query 2: Công ty có rủi ro "financial_distress" không?');
    console.log('-'.repeat(80));
    
    const fdResult = backwardChainer.querySpecificRisk('financial_distress', mockEvaluations);
    
    if (fdResult.has_risk) {
      console.log('✓ CÓ rủi ro financial_distress');
      console.log(`\n${fdResult.explanation}`);
    } else {
      console.log('✗ KHÔNG có rủi ro financial_distress');
    }
    
    // Query 3: Có rủi ro liquidity_crisis không?
    console.log('\n' + '-'.repeat(80));
    console.log('Query 3: Công ty có rủi ro "liquidity_crisis" không?');
    console.log('-'.repeat(80));
    
    const lcResult = backwardChainer.querySpecificRisk('liquidity_crisis', mockEvaluations);
    
    if (lcResult.has_risk) {
      console.log('✓ CÓ rủi ro liquidity_crisis');
      console.log(`\n${lcResult.explanation}`);
    } else {
      console.log('✗ KHÔNG có rủi ro liquidity_crisis');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nLưu ý: Cần có file composite_rules.json tại:');
    console.error(rulesPath);
  }
}

function demoComparison() {
  printSeparator('DEMO 3: SO SÁNH FORWARD CHAINING vs PATTERN MATCHING');
  
  console.log('\nMô tả:');
  console.log('- Forward Chaining: Vòng lặp suy diễn, rules kích hoạt lẫn nhau');
  console.log('- Pattern Matching: Kiểm tra rules một lần, không có vòng lặp');
  
  console.log('\n✓ Forward Chaining đã được demo ở Demo 1');
  console.log('✓ Với mock data này, cả 2 methods cho kết quả giống nhau');
  console.log('✓ Nhưng với rules phức tạp hơn, Forward Chaining sẽ tìm được nhiều risks hơn');
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  
  printSeparator('KNOWLEDGE INFERENCE ENGINE - NODE.JS VERSION');
  console.log('Demo các tính năng của Inference Engine V2');
  
  if (mode === 'forward' || mode === 'all') {
    demoForwardChaining();
  }
  
  if (mode === 'backward' || mode === 'all') {
    console.log('\n');
    demoBackwardChaining();
  }
  
  if (mode === 'comparison' || mode === 'all') {
    console.log('\n');
    demoComparison();
  }
  
  printSeparator('DEMO HOÀN TẤT');
  
  console.log('\nCách chạy:');
  console.log('  node demo.js           - Chạy tất cả demos');
  console.log('  node demo.js forward   - Chỉ Forward Chaining');
  console.log('  node demo.js backward  - Chỉ Backward Chaining');
  console.log('  node demo.js comparison - So sánh 2 modes');
}

main();
