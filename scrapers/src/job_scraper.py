import os
from typing import List, Dict, Optional
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from dotenv import load_dotenv
import time
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobScraper:
    def __init__(self):
        self.api_base_url = os.getenv('API_BASE_URL', 'http://localhost:8081/api')
        self.api_token = os.getenv('API_TOKEN', '')  # 如果需要认证的话
        
        # Selenium配置
        self.chrome_options = Options()
        self.chrome_options.add_argument('--headless')
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    def save_job(self, job_data: Dict) -> bool:
        """通过API保存职位信息到Node.js服务"""
        try:
            headers = {
                'Content-Type': 'application/json',
            }
            
            # 如果有API token，添加认证头
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            # 调用Node.js API保存职位
            response = requests.post(
                f'{self.api_base_url}/jobs/scraper/save',
                json=job_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                logger.info(f"保存新职位: {job_data['title']} - {job_data['company']}")
                return True
            elif response.status_code == 409:
                logger.info(f"职位已存在: {job_data['title']} - {job_data['company']}")
                return False
            else:
                logger.error(f"保存职位失败，状态码: {response.status_code}, 响应: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API请求失败: {e}")
            return False
        except Exception as e:
            logger.error(f"保存职位失败: {e}")
            return False

    def notify_scraping_started(self, sources: List[str], keywords: List[str], cities: List[str]) -> bool:
        """通知API开始爬取"""
        try:
            headers = {
                'Content-Type': 'application/json',
            }
            
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            response = requests.post(
                f'{self.api_base_url}/jobs/scraper/start',
                json={
                    'sources': sources,
                    'keywords': keywords,
                    'cities': cities,
                    'startTime': datetime.utcnow().isoformat()
                },
                headers=headers,
                timeout=10
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"通知API失败: {e}")
            return False

    def notify_scraping_finished(self, total_scraped: int) -> bool:
        """通知API爬取完成"""
        try:
            headers = {
                'Content-Type': 'application/json',
            }
            
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            response = requests.post(
                f'{self.api_base_url}/jobs/scraper/finish',
                json={
                    'totalScraped': total_scraped,
                    'finishTime': datetime.utcnow().isoformat()
                },
                headers=headers,
                timeout=10
            )
            
            return response.status_code == 200
        except Exception as e:
            logger.error(f"通知API失败: {e}")
            return False

    def scrape_zhipin(self, keyword: str = "Python", city: str = "北京", pages: int = 3) -> List[Dict]:
        """爬取Boss直聘职位信息"""
        jobs = []
        
        try:
            driver = webdriver.Chrome(options=self.chrome_options)
            
            for page in range(1, pages + 1):
                url = f"https://www.zhipin.com/web/geek/job?query={keyword}&city={city}&page={page}"
                driver.get(url)
                time.sleep(2)  # 等待页面加载
                
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                job_cards = soup.find_all('div', class_='job-card-wrapper')
                
                for card in job_cards:
                    try:
                        job_data = self._parse_zhipin_card(card)
                        if job_data:
                            jobs.append(job_data)
                    except Exception as e:
                        logger.error(f"解析职位卡片失败: {e}")
                        continue
                
                logger.info(f"Boss直聘第{page}页爬取完成，共获取{len(job_cards)}个职位")
                time.sleep(1)  # 避免请求过快
            
            driver.quit()
        except Exception as e:
            logger.error(f"爬取Boss直聘失败: {e}")
        
        return jobs

    def _parse_zhipin_card(self, card) -> Optional[Dict]:
        """解析Boss直聘职位卡片"""
        try:
            title_elem = card.find('span', class_='job-name')
            title = title_elem.get_text(strip=True) if title_elem else ""
            
            company_elem = card.find('h3', class_='name')
            company = company_elem.get_text(strip=True) if company_elem else ""
            
            salary_elem = card.find('span', class_='salary')
            salary = salary_elem.get_text(strip=True) if salary_elem else ""
            
            location_elem = card.find('span', class_='job-area')
            location = location_elem.get_text(strip=True) if location_elem else ""
            
            experience_elem = card.find('span', class_='job-experience')
            experience = experience_elem.get_text(strip=True) if experience_elem else ""
            
            education_elem = card.find('span', class_='job-degree')
            education = education_elem.get_text(strip=True) if education_elem else ""
            
            link_elem = card.find('a')
            url = f"https://www.zhipin.com{link_elem.get('href')}" if link_elem else ""
            
            tags = []
            tag_elems = card.find_all('li', class_='tag-item')
            for tag_elem in tag_elems:
                tag = tag_elem.get_text(strip=True)
                if tag:
                    tags.append(tag)
            
            if not title or not company:
                return None
            
            return {
                'title': title,
                'company': company,
                'location': location,
                'salary': salary,
                'description': f"{title}职位",  # Boss直聘列表页没有详细描述
                'requirements': [],
                'tags': tags,
                'jobType': 'full-time',
                'experience': experience,
                'education': education,
                'url': url,
                'source': 'Boss直聘',
                'publishedAt': datetime.utcnow()  # 使用当前时间作为发布时间
            }
            
        except Exception as e:
            logger.error(f"解析Boss直聘卡片失败: {e}")
            return None

    def scrape_lagou(self, keyword: str = "Python", city: str = "北京", pages: int = 3) -> List[Dict]:
        """爬取拉勾网职位信息"""
        jobs = []
        
        # 拉勾网需要更复杂的反爬虫处理，这里提供基础框架
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://www.lagou.com/',
        }
        
        try:
            for page in range(1, pages + 1):
                # 拉勾网的API接口需要特殊处理
                logger.info(f"拉勾网爬取功能需要进一步开发以处理反爬虫机制")
                
        except Exception as e:
            logger.error(f"爬取拉勾网失败: {e}")
        
        return jobs

    def run_scraper(self, sources: List[str] = None, keywords: List[str] = None, cities: List[str] = None):
        """运行爬虫"""
        if sources is None:
            sources = ['zhipin']
        if keywords is None:
            keywords = ['Python', 'JavaScript', 'Java']
        if cities is None:
            cities = ['北京', '上海', '深圳', '杭州']
        
        # 通知API开始爬取
        self.notify_scraping_started(sources, keywords, cities)
        
        total_scraped = 0
        
        for source in sources:
            for keyword in keywords:
                for city in cities:
                    try:
                        jobs = []
                        
                        if source == 'zhipin':
                            jobs = self.scrape_zhipin(keyword, city)
                        elif source == 'lagou':
                            jobs = self.scrape_lagou(keyword, city)
                        
                        # 保存职位到Node.js API
                        saved_count = 0
                        for job in jobs:
                            if self.save_job(job):
                                saved_count += 1
                        
                        total_scraped += saved_count
                        logger.info(f"{source} - {keyword} - {city}: 新增 {saved_count} 个职位")
                        
                        time.sleep(2)  # 避免请求过快
                        
                    except Exception as e:
                        logger.error(f"爬取失败 {source} - {keyword} - {city}: {e}")
        
        # 通知API爬取完成
        self.notify_scraping_finished(total_scraped)
        
        logger.info(f"本次爬取完成，总共新增 {total_scraped} 个职位")
        return total_scraped

    def close(self):
        """清理资源"""
        logger.info("爬虫资源清理完成")


if __name__ == "__main__":
    scraper = JobScraper()
    try:
        scraper.run_scraper()
    finally:
        scraper.close()