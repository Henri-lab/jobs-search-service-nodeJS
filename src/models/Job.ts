import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
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
  publishedAt: Date;
  scrapedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema: Schema<IJob> = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '职位标题不能为空'],
    trim: true,
    maxlength: [200, '职位标题不能超过200个字符']
  },
  company: {
    type: String,
    required: [true, '公司名称不能为空'],
    trim: true,
    maxlength: [100, '公司名称不能超过100个字符']
  },
  location: {
    type: String,
    required: [true, '工作地点不能为空'],
    trim: true,
    maxlength: [100, '工作地点不能超过100个字符']
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [50, '薪资信息不能超过50个字符']
  },
  description: {
    type: String,
    required: [true, '职位描述不能为空'],
    maxlength: [5000, '职位描述不能超过5000个字符']
  },
  requirements: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  experience: {
    type: String,
    required: [true, '经验要求不能为空'],
    trim: true,
    maxlength: [50, '经验要求不能超过50个字符']
  },
  education: {
    type: String,
    trim: true,
    maxlength: [50, '学历要求不能超过50个字符']
  },
  url: {
    type: String,
    required: [true, '职位链接不能为空'],
    unique: true,
    trim: true
  },
  source: {
    type: String,
    required: [true, '来源网站不能为空'],
    trim: true,
    maxlength: [50, '来源网站不能超过50个字符']
  },
  publishedAt: {
    type: Date,
    required: [true, '发布时间不能为空']
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ company: 1, location: 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ publishedAt: -1 });
jobSchema.index({ scrapedAt: -1 });

export default mongoose.model<IJob>('Job', jobSchema);