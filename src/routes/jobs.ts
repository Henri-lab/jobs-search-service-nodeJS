import express from 'express';
import { getJobs, getJobById, getJobStats } from '../controllers/jobController';
import { saveJobFromScraper, notifyScrapingStart, notifyScrapingFinish, triggerScraping } from '../controllers/scraperController';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100次请求
  message: { message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const scraperLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 50, // 爬虫API限制更宽松
  message: { message: '爬虫请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 公开API - 获取职位数据
router.get('/', generalLimiter, getJobs);
router.get('/stats', generalLimiter, getJobStats);
router.get('/:id', generalLimiter, getJobById);

// 爬虫内部API - 用于Python爬虫调用
router.post('/scraper/save', scraperLimiter, saveJobFromScraper);
router.post('/scraper/start', scraperLimiter, notifyScrapingStart);
router.post('/scraper/finish', scraperLimiter, notifyScrapingFinish);
router.post('/scraper/trigger', scraperLimiter, triggerScraping);

export default router;