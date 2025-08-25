import dotenv from 'dotenv';
import path from 'path';
import Job from '../src/models/Job';
import connectDB from '../src/config/database';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sampleJobs = [
  {
    title: "前端开发工程师",
    company: "阿里巴巴",
    location: "杭州",
    salary: "20k-35k",
    description: "负责阿里云控制台前端开发，使用React/Vue技术栈，参与大型前端项目架构设计。",
    requirements: ["3年以上前端开发经验", "熟练掌握React/Vue", "熟悉TypeScript", "有大型项目经验"],
    tags: ["React", "Vue", "TypeScript", "前端工程化"],
    jobType: "full-time" as const,
    experience: "3-5年",
    education: "本科",
    url: "https://example.com/job/1",
    source: "测试数据",
    publishedAt: new Date('2024-08-20')
  },
  {
    title: "Node.js后端开发工程师",
    company: "腾讯",
    location: "深圳",
    salary: "25k-40k",
    description: "负责微信小程序后端服务开发，使用Node.js构建高性能API服务。",
    requirements: ["4年以上后端开发经验", "精通Node.js", "熟悉MySQL/MongoDB", "微服务架构经验"],
    tags: ["Node.js", "Express", "MongoDB", "微服务"],
    jobType: "full-time" as const,
    experience: "3-5年",
    education: "本科",
    url: "https://example.com/job/2",
    source: "测试数据",
    publishedAt: new Date('2024-08-21')
  },
  {
    title: "全栈开发工程师",
    company: "字节跳动",
    location: "北京",
    salary: "30k-50k",
    description: "负责抖音创作者平台全栈开发，前后端技术栈不限。",
    requirements: ["5年以上全栈开发经验", "前后端技术栈熟练", "有大并发处理经验", "团队协作能力强"],
    tags: ["全栈", "React", "Node.js", "大数据"],
    jobType: "full-time" as const,
    experience: "5-10年",
    education: "本科",
    url: "https://example.com/job/3",
    source: "测试数据",
    publishedAt: new Date('2024-08-22')
  },
  {
    title: "Python开发工程师",
    company: "美团",
    location: "北京",
    salary: "18k-30k",
    description: "负责美团外卖推荐算法开发，使用Python进行数据处理和机器学习。",
    requirements: ["3年以上Python开发经验", "熟悉机器学习", "有推荐系统经验", "熟悉Django/Flask"],
    tags: ["Python", "机器学习", "推荐算法", "Django"],
    jobType: "full-time" as const,
    experience: "3-5年",
    education: "本科",
    url: "https://example.com/job/4",
    source: "测试数据",
    publishedAt: new Date('2024-08-23')
  },
  {
    title: "UI/UX设计师",
    company: "小米",
    location: "北京",
    salary: "15k-25k",
    description: "负责MIUI界面设计，参与小米产品用户体验设计。",
    requirements: ["3年以上UI/UX设计经验", "熟练使用Figma/Sketch", "有移动端设计经验", "良好的审美能力"],
    tags: ["UI设计", "UX设计", "Figma", "移动端"],
    jobType: "full-time" as const,
    experience: "3-5年",
    education: "本科",
    url: "https://example.com/job/5",
    source: "测试数据",
    publishedAt: new Date('2024-08-24')
  }
];

async function seedDatabase() {
  try {
    console.log('连接数据库中...');
    
    // 先建立数据库连接
    await connectDB();
    console.log('数据库连接成功');
    
    // 清空现有数据
    const deleteResult = await Job.deleteMany({});
    console.log(`已清空现有数据: ${deleteResult.deletedCount} 条`);

    // 插入测试数据
    const insertResult = await Job.insertMany(sampleJobs);
    console.log(`成功插入 ${insertResult.length} 条测试数据`);

    console.log('数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据初始化失败:', error);
    process.exit(1);
  }
}

seedDatabase();