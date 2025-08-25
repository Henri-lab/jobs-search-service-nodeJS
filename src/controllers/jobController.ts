import { Request, Response } from 'express';
import Job, { IJob } from '../models/Job';
import Joi from 'joi';

const jobSearchSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  keyword: Joi.string().allow('').max(100),
  company: Joi.string().allow('').max(100),
  location: Joi.string().allow('').max(100),
  jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship'),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  sortBy: Joi.string().valid('publishedAt', 'scrapedAt', 'title', 'company').default('publishedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = jobSearchSchema.validate(req.query);
    if (error) {
      res.status(400).json({ message: error.details[0]?.message });
      return;
    }

    const { page, limit, keyword, company, location, jobType, tags, sortBy, sortOrder } = value;
    
    const filter: any = { isActive: true };
    
    if (keyword) {
      filter.$text = { $search: keyword };
    }
    
    if (company) {
      filter.company = { $regex: company, $options: 'i' };
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (jobType) {
      filter.jobType = jobType;
    }
    
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Job.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages,
        totalJobs: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (id&&!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ message: '无效的职位ID' });
      return;
    }

    const job = await Job.findById(id).select('-__v');
    
    if (!job) {
      res.status(404).json({ message: '职位不存在' });
      return;
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job by id error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getJobStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalJobs,
      totalCompanies,
      jobsByType,
      jobsByLocation,
      recentJobs
    ] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Job.distinct('company').then(companies => companies.length),
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$jobType', count: { $sum: 1 } } }
      ]),
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Job.countDocuments({ 
        isActive: true, 
        scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      stats: {
        totalJobs,
        totalCompanies,
        recentJobs,
        jobsByType: jobsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        topLocations: jobsByLocation.map(item => ({
          location: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};