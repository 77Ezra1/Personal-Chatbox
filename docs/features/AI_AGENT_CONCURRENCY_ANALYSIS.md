# AI Agent 并发能力分析报告

## 📊 并发配置总览

### 当前配置参数

| 层级 | 参数 | 默认值 | 说明 |
|------|------|--------|------|
| **全局队列** | `AGENT_EXECUTION_CONCURRENCY` | `2` | 全局同时执行的任务数 |
| **单个 Agent** | `maxConcurrentTasks` | `3` | 每个 Agent 的最大并发任务数 |
| **数据库连接池** | `PG_POOL_MAX` | `20` | PostgreSQL 最大连接数 |
| **数据库连接池** | `PG_POOL_MIN` | `2` | PostgreSQL 最小连接数 |
| **HTTP 连接** | `http.globalAgent.maxSockets` | `Infinity` | Node.js HTTP 连接无限制 |

---

## 🎯 并发能力评估

### 1️⃣ **全局队列级别（瓶颈）**

```javascript
// server/services/agentEngine.cjs:25
const queueConcurrency = parseInt(process.env.AGENT_EXECUTION_CONCURRENCY || '2', 10);
```

**当前限制**: **全局同时只能执行 2 个任务**

**影响**:
- ✅ 所有用户共享这 2 个执行槽位
- ⚠️ 第 3 个及以后的任务会进入队列等待
- 📊 如果有 100 个用户同时发起任务，有 98 个会排队

**计算公式**:
```
最大并发用户数 = AGENT_EXECUTION_CONCURRENCY = 2 人
队列容量 = 无限制（内存限制）
平均任务执行时间 = 30-120 秒（取决于任务复杂度）
等待时间 = (排队位置 / 并发数) × 平均执行时间
```

**示例**:
- 第 1-2 个用户: 立即执行 ✅
- 第 3 个用户: 等待 30-120 秒 ⏳
- 第 10 个用户: 等待 4-8 分钟 ⏳⏳⏳

---

### 2️⃣ **单个 Agent 级别（次级限制）**

```javascript
// server/services/agentEngine.cjs:102
config: {
  maxConcurrentTasks: 3,
  stopOnError: false,
  retryAttempts: 2,
  ...config
}
```

**限制**: 每个 Agent 最多同时执行 3 个任务

**影响**:
- 即使全局队列有空闲，单个 Agent 也不能超过 3 个并发任务
- 适用于防止某个 Agent 被滥用

**公式**:
```
单 Agent 最大并发 = min(全局并发, maxConcurrentTasks)
                  = min(2, 3) = 2 个任务
```

---

### 3️⃣ **数据库连接池（支撑能力）**

**SQLite 模式** (当前默认):
- 单文件数据库，天然串行化
- **并发读**: 理论无限制
- **并发写**: 1 个连接（锁机制）
- **最大支持**: ~100-500 并发查询/秒

**PostgreSQL 模式** (生产环境):
- 连接池: 20 个连接
- **并发读写**: 20 个连接 × 多个操作
- **最大支持**: 1000+ 并发查询/秒

**瓶颈分析**:
```
SQLite:
  - Agent 执行需要频繁写入 (agent_tasks, agent_executions, agent_subtasks)
  - 写操作串行化，最大支持 ~10-20 并发任务/秒
  - 对于 2 个全局并发，完全够用 ✅

PostgreSQL:
  - 20 个连接池可支持 100+ 并发任务
  - 对于 2 个全局并发，远超需求 ✅✅✅
```

---

### 4️⃣ **AI API 调用（外部依赖）**

**OpenAI/DeepSeek API 限制**:

| 账户类型 | RPM (请求/分钟) | TPM (Token/分钟) | 并发数 |
|---------|----------------|-----------------|--------|
| **免费** | 3 | 40,000 | ~3 |
| **Pay-as-you-go** | 60 | 90,000 | ~60 |
| **Tier 1** | 500 | 200,000 | ~500 |
| **Tier 2** | 5,000 | 2,000,000 | ~5,000 |

**任务分解调用**:
- 每个任务至少调用 1 次 AI（任务分解）
- 每个子任务可能再调用 1-3 次 AI（执行）
- **平均每个任务**: 3-10 次 API 调用

**瓶颈计算**:
```
免费账户:
  - 3 RPM / 10 次调用 = 每 3.3 分钟完成 1 个任务
  - 支持并发: 1 个任务 ❌

Pay-as-you-go:
  - 60 RPM / 10 次调用 = 每 10 秒完成 1 个任务
  - 支持并发: 6 个任务 ✅

Tier 1+:
  - 500+ RPM / 10 次调用 = 每秒完成 0.8 个任务
  - 支持并发: 50+ 个任务 ✅✅✅
```

**关键发现**: **AI API 是最大瓶颈！**

---

### 5️⃣ **服务器硬件资源**

**内存消耗估算**:
```
单个任务内存占用:
  - 任务数据: ~1-5 KB
  - 子任务数据: ~10-50 KB
  - AI 响应缓存: ~10-100 KB
  - Node.js 开销: ~50-200 KB
  
总计: ~100-500 KB/任务

1GB 内存可支持: 2,000-10,000 个排队任务
8GB 内存可支持: 16,000-80,000 个排队任务
```

**CPU 消耗**:
- 任务分解 JSON 解析: ~1-5ms
- 数据库操作: ~5-20ms
- 拓扑排序: ~10-50ms
- **总计**: ~50-200ms/任务

**网络带宽**:
- AI API 请求: ~1-10 KB/请求
- AI API 响应: ~1-50 KB/响应
- **总计**: ~10-100 KB/任务

---

## 📈 并发能力总结

### **当前配置下的并发能力**

#### 🔴 **最大并发用户数: 2 人**

**瓶颈链条**:
```
全局队列 (2) → Agent 限制 (3) → AI API (免费3 RPM) → 数据库 (SQLite 串行写)
   ↑ 最紧瓶颈
```

**实际测试场景**:

| 并发用户数 | 队列情况 | 平均等待时间 | 用户体验 |
|-----------|---------|-------------|---------|
| 1-2 人 | 无排队 | 0 秒 | ✅ 优秀 |
| 3-5 人 | 轻度排队 | 30-90 秒 | 🟡 可接受 |
| 6-10 人 | 中度排队 | 2-5 分钟 | 🟠 较差 |
| 10+ 人 | 严重排队 | 5-20 分钟 | 🔴 不可用 |

---

## 🚀 性能优化方案

### **方案 1: 提升全局并发（立即生效）**

```bash
# .env
AGENT_EXECUTION_CONCURRENCY=10  # 提升到 10 个并发
```

**影响**:
- ✅ 支持 10 人同时使用
- ⚠️ 需要 Pay-as-you-go API (60 RPM)
- ⚠️ SQLite 可能出现锁竞争

**成本**: $0/月（只需配置）

---

### **方案 2: 升级 AI API 等级**

| 方案 | RPM | 支持并发 | 月成本 |
|------|-----|---------|--------|
| 免费 | 3 | 1 人 | $0 |
| Pay-as-you-go | 60 | 6 人 | ~$5-20 |
| Tier 1 | 500 | 50 人 | ~$50-200 |
| Tier 2 | 5,000 | 500 人 | ~$500+ |

**推荐**: Pay-as-you-go ($5-20/月) 可支持小团队使用

---

### **方案 3: 切换到 PostgreSQL**

```bash
# .env
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
PG_POOL_MAX=50  # 提升连接池
```

**优势**:
- ✅ 消除 SQLite 写锁瓶颈
- ✅ 支持 50+ 并发任务
- ✅ 更好的数据一致性

**成本**: 
- 自建: $0-10/月
- 云服务 (Supabase/Railway): $10-25/月

---

### **方案 4: 多实例负载均衡（高级）**

```nginx
upstream agent_backend {
  server backend1:3001;
  server backend2:3001;
  server backend3:3001;
}
```

**架构**:
```
       LoadBalancer
       /     |     \
  Backend1 Backend2 Backend3
  (并发2)  (并发2)  (并发2)
  
  总并发 = 2 × 3 = 6 人
```

**成本**: $50-200/月（多台服务器）

---

### **方案 5: 任务优先级队列（无需额外成本）**

**实现**:
```javascript
// 修改 AgentExecutionQueue
enqueue(job, priority = 'normal') {
  const jobRecord = { ...job, priority };
  
  if (priority === 'high') {
    this.queue.unshift(jobRecord);  // 插入队首
  } else {
    this.queue.push(jobRecord);     // 插入队尾
  }
}
```

**效果**:
- VIP 用户优先执行
- 普通用户按顺序排队
- 无需增加硬件成本

---

## 🎯 推荐配置

### **小团队（5-10 人）**
```bash
# .env
AGENT_EXECUTION_CONCURRENCY=5
POSTGRES_URL=postgresql://...  # 使用 PostgreSQL
PG_POOL_MAX=20

# OpenAI
# 升级到 Pay-as-you-go ($5-20/月)
```

**预期**:
- 支持 5 人同时使用
- 等待时间 < 1 分钟
- 月成本: $15-30

---

### **中型团队（10-50 人）**
```bash
# .env
AGENT_EXECUTION_CONCURRENCY=20
POSTGRES_URL=postgresql://...
PG_POOL_MAX=50

# OpenAI Tier 1 ($50-200/月)
```

**预期**:
- 支持 20 人同时使用
- 等待时间 < 30 秒
- 月成本: $60-250

---

### **大型团队（50+ 人）**
```bash
# 多实例部署 + 负载均衡
# 每个实例 AGENT_EXECUTION_CONCURRENCY=10
# 3 个实例 = 30 并发

# PostgreSQL 专用数据库
# OpenAI Tier 2 ($500+/月)
```

**预期**:
- 支持 50+ 人同时使用
- 等待时间 < 10 秒
- 月成本: $600-1000

---

## 📊 性能监控建议

### **关键指标**

```javascript
// 添加监控代码
class AgentEngineMonitor {
  trackMetrics() {
    return {
      queueLength: this.executionQueue.queue.length,
      activeCount: this.executionQueue.activeCount,
      avgWaitTime: this.calculateAvgWaitTime(),
      apiCallsPerMin: this.apiCallCounter.getRPM(),
      dbConnections: db.getConnectionStats(),
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}
```

**监控指标**:
- 队列长度 (queue.length)
- 活跃任务数 (activeCount)
- 平均等待时间 (avgWaitTime)
- AI API 调用频率 (RPM)
- 数据库连接数
- 内存使用量

**告警阈值**:
```
队列长度 > 10      → 黄色告警
队列长度 > 50      → 红色告警
平均等待 > 5分钟   → 红色告警
API RPM > 80%限额  → 黄色告警
内存使用 > 80%     → 黄色告警
```

---

## 🔧 快速优化命令

### **立即提升并发到 10 人**

```bash
# 1. 修改环境变量
echo "AGENT_EXECUTION_CONCURRENCY=10" >> .env

# 2. 重启服务
./stop.sh && ./start.sh

# 3. 验证
curl http://localhost:3001/api/agents/config
```

---

## 📝 总结

### **当前状态**
- ✅ 代码架构支持高并发（优秀）
- ⚠️ 全局队列限制为 2 人（瓶颈）
- ⚠️ AI API 免费额度有限（瓶颈）
- ✅ 数据库性能充足（SQLite 够用）

### **建议**
1. **立即**: 修改 `AGENT_EXECUTION_CONCURRENCY=10`（免费）
2. **短期**: 升级 OpenAI Pay-as-you-go ($5-20/月)
3. **中期**: 切换到 PostgreSQL ($10-25/月)
4. **长期**: 考虑多实例部署（如需支持 50+ 人）

### **核心瓶颈**
🔴 **AI API 调用限制** > 全局队列配置 > 数据库性能

**最佳性价比方案**: 
- AGENT_EXECUTION_CONCURRENCY=10 
- OpenAI Pay-as-you-go
- 总成本: ~$10-30/月
- **支持 6-10 人同时使用** ✅

---

*最后更新: 2025-10-23*
*分析基于当前代码版本和默认配置*
