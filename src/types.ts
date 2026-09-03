export interface ZineAnalysis {
  subject: string;
  lighting: string;
  palette: string[];
  mood: string;
}

export interface RemixResult {
  id: string;
  timestamp: number;
  originalImage: string;
  title: string;
  zineVolume: string;
  summary: string;
  analysis: ZineAnalysis;
  tags: string[];
  prompt: string;
  outputImageUrl: string;
  provider: string;
  modelName: string;
  durationSeconds: string;
  stylePreset: string;
  aspectRatio: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  tag: string;
  aspectRatio?: string;
  iconName: string;
}

export interface SampleImage {
  id: string;
  label: string;
  url: string;
  category: string;
}
