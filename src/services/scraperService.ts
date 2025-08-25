import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScrapingResult {
  success: boolean;
  message: string;
  newJobsCount?: number;
}

export class ScraperService {
  private readonly condaEnv = 'jobs-scraper';
  private readonly scraperPath = path.join(__dirname, '../../../scrapers/src');

  async runScraper(sources: string[] = ['zhipin'], keywords: string[] = ['Python'], cities: string[] = ['北京']): Promise<ScrapingResult> {
    try {
      const command = this.buildScrapingCommand(sources, keywords, cities);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.scraperPath,
        timeout: 300000 // 5分钟超时
      });

      if (stderr) {
        console.error('Scraper stderr:', stderr);
      }

      console.log('Scraper output:', stdout);

      // 解析输出获取新增职位数量
      const newJobsMatch = stdout.match(/总共新增 (\d+) 个职位/);
      const newJobsCount = newJobsMatch?.[1] ? parseInt(newJobsMatch[1]) : 0;

      return {
        success: true,
        message: '爬虫执行成功',
        newJobsCount
      };
    } catch (error: any) {
      console.error('Scraper execution failed:', error);
      return {
        success: false,
        message: `爬虫执行失败: ${error.message}`
      };
    }
  }

  private buildScrapingCommand(sources: string[], keywords: string[], cities: string[]): string {
    // 构建Python脚本执行命令
    const condaPath = process.env['CONDA_PATH'] || '~/miniconda3';
    const activateCmd = `source ${condaPath}/etc/profile.d/conda.sh && conda activate ${this.condaEnv}`;
    
    const pythonScript = `
from job_scraper import JobScraper
scraper = JobScraper()
try:
    total = scraper.run_scraper(
        sources=${JSON.stringify(sources)}, 
        keywords=${JSON.stringify(keywords)}, 
        cities=${JSON.stringify(cities)}
    )
    print(f"总共新增 {total} 个职位")
finally:
    scraper.close()
`;

    return `${activateCmd} && python -c "${pythonScript.replace(/"/g, '\\"')}"`;
  }

  async setupScraperEnvironment(): Promise<ScrapingResult> {
    try {
      const setupScript = path.join(__dirname, '../../../scrapers/setup_conda.sh');
      const { stdout, stderr } = await execAsync(`bash ${setupScript}`, {
        timeout: 600000 // 10分钟超时
      });

      if (stderr && !stderr.includes('Collecting')) {
        console.error('Setup stderr:', stderr);
      }

      console.log('Setup output:', stdout);

      return {
        success: true,
        message: 'conda环境设置成功'
      };
    } catch (error: any) {
      console.error('Setup failed:', error);
      return {
        success: false,
        message: `环境设置失败: ${error.message}`
      };
    }
  }

  async getScrapingStatus(): Promise<{ isRunning: boolean; lastRun?: Date }> {
    // 这里可以添加检查爬虫运行状态的逻辑
    // 比如检查进程或者日志文件
    return {
      isRunning: false,
      lastRun: new Date()
    };
  }
}

export default new ScraperService();