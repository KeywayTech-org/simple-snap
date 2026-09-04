import { StylePreset, SampleImage } from '../types';

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'scenes-gathered-zine-v1-3',
    name: '拾景纸刊',
    description: '真景为锚 · 插画成场 · 色彩成结构 · 撕纸成界：照片化为留白呼吸的纸本拼贴海报',
    tag: 'scenes-gathered-zine-v1-3',
    iconName: 'BookOpen',
  },
  {
    id: 'gc-minimal-zine-poster-v0-3',
    name: '诗性纸刊',
    description: '诗性纸面 · 大量留白 · 一个小型视觉事件 · 实验排印 · 一处高饱和强调：照片化为安静的纸张极简海报',
    tag: 'gc-minimal-zine-poster-v0-3',
    iconName: 'Layers',
  },
];

// 按风格 id 取展示名；未识别的 id 原样回退
export function getPresetDisplayName(id?: string): string {
  return STYLE_PRESETS.find((p) => p.id === id)?.name ?? id ?? 'AI 风格海报';
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-1',
    label: '素石与光影',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    category: '静物意境',
  },
  {
    id: 'sample-2',
    label: '暮色微澜',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    category: '人文光影',
  },
  {
    id: 'sample-3',
    label: '纸页墨迹',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    category: '日常茶席',
  },
  {
    id: 'sample-4',
    label: '庭院回廊',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    category: '空间造景',
  },
];
