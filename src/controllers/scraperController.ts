import { Request, Response } from 'express';
import Job, { IJob } from '../models/Job';
import Joi from 'joi';

const saveJobSchema = Joi.object({
  title: Joi.string().required().max(200),
  company: Joi.string().required().max(100),
  location: Joi.string().required().max(100),
  salary: Joi.string().allow('').max(50),
  description: Joi.string().required(),
  requirements: Joi.array().items(Joi.string()),
  tags: Joi.array().items(Joi.string()).max(20),
  jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship').default('full-time'),
  experience: Joi.string().allow('').max(50),
  education: Joi.string().allow('').max(50),
  url: Joi.string().uri().required(),
  source: Joi.string().required().max(50),
  publishedAt: Joi.date().iso()
});

const scrapingStartSchema = Joi.object({
  sources: Joi.array().items(Joi.string()).required(),
  keywords: Joi.array().items(Joi.string()).required(),
  cities: Joi.array().items(Joi.string()).required(),
  startTime: Joi.date().iso().required()
});

const scrapingFinishSchema = Joi.object({
  totalScraped: Joi.number().integer().min(0).required(),
  finishTime: Joi.date().iso().required()
});

// 爬虫保存职位数据的API
export const saveJobFromScraper = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = saveJobSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const jobData = {
      ...value,
      scrapedAt: new Date(),
      isActive: true
    };

    // 检查是否已存在相同URL的职位
    const existingJob = await Job.findOne({ url: jobData.url });
    if (existingJob) {
      res.status(409).json({ message: '职位已存在', jobId: existingJob._id });
      return;
    }

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({ 
      message: '职位保存成功', 
      jobId: job._id,
      title: job.title,
      company: job.company 
    });
  } catch (error) {
    console.error('Save job from scraper error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 爬虫开始通知API
export const notifyScrapingStart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = scrapingStartSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { sources, keywords, cities, startTime } = value;
    
    console.log(`爬虫开始运行: 
      - 数据源: ${sources.join(', ')}
      - 关键词: ${keywords.join(', ')}
      - 城市: ${cities.join(', ')}
      - 开始时间: ${startTime}`);

    // 这里可以记录爬虫运行日志到数据库
    // 或者发送通知等

    res.status(200).json({ message: '爬虫开始通知已接收' });
  } catch (error) {
    console.error('Notify scraping start error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 爬虫完成通知API
export const notifyScrapingFinish = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = scrapingFinishSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { totalScraped, finishTime } = value;
    
    console.log(`爬虫运行完成: 
      - 新增职位: ${totalScraped} 个
      - 完成时间: ${finishTime}`);

    // 这里可以记录爬虫运行结果到数据库
    // 或者发送完成通知等

    res.status(200).json({ 
      message: '爬虫完成通知已接收',
      totalScraped 
    });
  } catch (error) {
    console.error('Notify scraping finish error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 手动触发爬虫（可选）
export const triggerScraping = async (req: Request, res: Response): Promise<void> => {
  try {
    // 这里可以通过队列或者其他方式触发Python爬虫运行
    // 比如调用消息队列、写入任务表等
    
    res.status(200).json({ 
      message: '爬虫任务已触发',
      note: '请查看爬虫服务日志获取运行状态'
    });
  } catch (error) {
    console.error('Trigger scraping error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};