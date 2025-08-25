import schedule
import time
from job_scraper import JobScraper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_daily_scraper():
    """每日定时运行爬虫"""
    logger.info("开始执行定时爬虫任务")
    scraper = JobScraper()
    try:
        total_scraped = scraper.run_scraper(
            sources=['zhipin'],
            keywords=['Python', 'JavaScript', 'Java', 'Node.js', 'React', 'Vue'],
            cities=['北京', '上海', '深圳', '杭州', '广州']
        )
        logger.info(f"定时爬虫任务完成，新增职位: {total_scraped}")
    except Exception as e:
        logger.error(f"定时爬虫任务失败: {e}")
    finally:
        scraper.close()


def run_hourly_scraper():
    """每小时运行热门关键词爬虫"""
    logger.info("开始执行每小时爬虫任务")
    scraper = JobScraper()
    try:
        total_scraped = scraper.run_scraper(
            sources=['zhipin'],
            keywords=['Python', 'JavaScript'],
            cities=['北京', '上海']
        )
        logger.info(f"每小时爬虫任务完成，新增职位: {total_scraped}")
    except Exception as e:
        logger.error(f"每小时爬虫任务失败: {e}")
    finally:
        scraper.close()


if __name__ == "__main__":
    # 设置定时任务
    schedule.every().day.at("09:00").do(run_daily_scraper)  # 每天9点运行
    schedule.every().hour.do(run_hourly_scraper)  # 每小时运行
    
    logger.info("爬虫调度器启动")
    logger.info("每日任务: 09:00")
    logger.info("每小时任务: 每小时执行")
    
    # 立即运行一次
    logger.info("立即执行一次爬虫任务")
    run_daily_scraper()
    
    # 开始调度循环
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次