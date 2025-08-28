# Jobs Search API 前端请求规范文档

## 基础信息
- **Base URL**: `http://localhost:3000` (开发环境)
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (在需要认证的接口中)

---

## TypeScript 类型定义

### 基础类型

```typescript
// 用户相关类型
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  lastLogin?: string; // ISO date string
}

// 职位相关类型
interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  requirements: string[];
  tags: string[];
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  education?: string;
  url: string;
  source: string;
  publishedAt: string; // ISO date string
  scrapedAt: string; // ISO date string
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// 分页信息
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalJobs: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 统计信息
interface JobStats {
  totalJobs: number;
  totalCompanies: number;
  recentJobs: number;
  jobsByType: Record<string, number>;
  topLocations: Array<{
    location: string;
    count: number;
  }>;
}

// API 响应基础类型
interface ApiResponse<T = any> {
  message?: string;
  [key: string]: T;
}

interface ApiError {
  message: string;
}
```

---

## API 接口详情

### 1. 系统接口

#### 健康检查
- **URL**: `GET /health`
- **描述**: 检查服务状态
- **请求参数**: 无
- **响应类型**:
```typescript
interface HealthResponse {
  status: 'OK';
  timestamp: string;
  uptime: number;
  environment: string;
}
```

#### API 文档
- **URL**: `GET /api`
- **描述**: 获取API文档信息
- **请求参数**: 无
- **响应类型**:
```typescript
interface ApiDocResponse {
  message: string;
  version: string;
  endpoints: {
    auth: Record<string, string>;
    jobs: Record<string, string>;
  };
  documentation: string;
}
```

---

### 2. 认证接口 (`/api/auth`)

#### 用户注册
- **URL**: `POST /api/auth/register`
- **描述**: 新用户注册
- **Rate Limit**: 5 次/15分钟/IP
- **请求类型**:
```typescript
interface RegisterRequest {
  username: string; // 3-30个字符
  email: string;    // 有效邮箱格式
  password: string; // 最少6个字符
}
```
- **响应类型**:
```typescript
interface RegisterResponse {
  message: string;
  token: string;
  user: User;
}
```
- **错误响应**:
  - `400`: 参数验证失败
  - `400`: 用户名或邮箱已存在
  - `500`: 服务器内部错误

#### 用户登录
- **URL**: `POST /api/auth/login`
- **描述**: 用户登录
- **Rate Limit**: 5 次/15分钟/IP
- **请求类型**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```
- **响应类型**:
```typescript
interface LoginResponse {
  message: string;
  token: string;
  user: User;
}
```
- **错误响应**:
  - `400`: 参数验证失败
  - `401`: 邮箱或密码错误
  - `500`: 服务器内部错误

---

### 3. 职位接口 (`/api/jobs`)

#### 获取职位列表
- **URL**: `GET /api/jobs`
- **描述**: 分页获取职位列表，支持筛选和排序
- **Rate Limit**: 100 次/15分钟/IP
- **请求参数** (Query Parameters):
```typescript
interface JobSearchParams {
  page?: number;        // 页码，默认1
  limit?: number;       // 每页数量，1-50，默认10
  keyword?: string;     // 关键词搜索，最多100字符
  company?: string;     // 公司名筛选，最多100字符
  location?: string;    // 地点筛选，最多100字符
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  tags?: string[];      // 标签筛选，最多10个，每个最多50字符
  sortBy?: 'publishedAt' | 'scrapedAt' | 'title' | 'company'; // 排序字段，默认publishedAt
  sortOrder?: 'asc' | 'desc'; // 排序方向，默认desc
}
```
- **响应类型**:
```typescript
interface JobListResponse {
  jobs: Job[];
  pagination: Pagination;
}
```
- **错误响应**:
  - `400`: 参数验证失败
  - `500`: 服务器内部错误

#### 获取单个职位详情
- **URL**: `GET /api/jobs/:id`
- **描述**: 根据ID获取职位详细信息
- **Rate Limit**: 100 次/15分钟/IP
- **请求参数**:
```typescript
interface JobDetailParams {
  id: string; // MongoDB ObjectId格式
}
```
- **响应类型**:
```typescript
interface JobDetailResponse {
  job: Job;
}
```
- **错误响应**:
  - `400`: 无效的职位ID
  - `404`: 职位不存在
  - `500`: 服务器内部错误

#### 获取职位统计
- **URL**: `GET /api/jobs/stats`
- **描述**: 获取职位统计信息
- **Rate Limit**: 100 次/15分钟/IP
- **请求参数**: 无
- **响应类型**:
```typescript
interface JobStatsResponse {
  stats: JobStats;
}
```
- **错误响应**:
  - `500`: 服务器内部错误

---

### 4. 爬虫接口 (`/api/jobs/scraper`) - 内部使用

> 注意：以下接口仅供Python爬虫服务调用，前端通常不需要使用

#### 保存职位数据
- **URL**: `POST /api/jobs/scraper/save`
- **Rate Limit**: 50 次/分钟/IP
- **请求类型**:
```typescript
interface SaveJobRequest {
  title: string;        // 最多200字符
  company: string;      // 最多100字符
  location: string;     // 最多100字符
  salary?: string;      // 最多50字符
  description: string;  // 必填
  requirements?: string[];
  tags?: string[];      // 最多20个
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience?: string;  // 最多50字符
  education?: string;   // 最多50字符
  url: string;          // 必填，有效URL
  source: string;       // 最多50字符
  publishedAt?: string; // ISO date string
}
```

#### 爬虫开始通知
- **URL**: `POST /api/jobs/scraper/start`
- **请求类型**:
```typescript
interface ScrapingStartRequest {
  sources: string[];
  keywords: string[];
  cities: string[];
  startTime: string; // ISO date string
}
```

#### 爬虫完成通知
- **URL**: `POST /api/jobs/scraper/finish`
- **请求类型**:
```typescript
interface ScrapingFinishRequest {
  totalScraped: number;
  finishTime: string; // ISO date string
}
```

#### 触发爬虫
- **URL**: `POST /api/jobs/scraper/trigger`
- **描述**: 手动触发爬虫任务

---

## 错误处理

### HTTP状态码
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `404`: 资源不存在
- `409`: 资源冲突（如重复数据）
- `429`: 请求过于频繁
- `500`: 服务器内部错误

### 错误响应格式
```typescript
interface ErrorResponse {
  message: string;
  retryAfter?: string; // 限流时提供
}
```

---

## 使用示例

### 前端请求示例

```typescript
// 获取职位列表
const fetchJobs = async (params: JobSearchParams): Promise<JobListResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const response = await fetch(`/api/jobs?${queryParams}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

// 用户登录
const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};

// 获取职位详情
const fetchJobDetail = async (id: string): Promise<JobDetailResponse> => {
  const response = await fetch(`/api/jobs/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};
```

---

## 注意事项

1. **认证**: 目前所有公开API都不需要认证，爬虫API为内部使用
2. **Rate Limiting**: 所有接口都有频率限制，请注意控制请求频率
3. **数据验证**: 所有请求参数都会进行严格验证
4. **错误处理**: 请根据HTTP状态码和错误信息进行适当的错误处理
5. **分页**: 职位列表接口支持分页，请合理设置`page`和`limit`参数
6. **搜索**: 支持全文搜索和多条件筛选
7. **CORS**: 已配置CORS，支持跨域请求
