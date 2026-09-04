// 风格 → Skill 注册表：每个风格的解读 system prompt 独立成文件，此处按风格 id 路由
import {
  SCENES_GATHERED_ZINE_ID,
  SCENES_GATHERED_ZINE_NAME,
  SCENES_GATHERED_ZINE_SKILL_PROMPT,
} from './scenes-gathered-zine-v1-3';
import {
  GC_MINIMAL_ZINE_POSTER_ID,
  GC_MINIMAL_ZINE_POSTER_NAME,
  GC_MINIMAL_ZINE_POSTER_SKILL_PROMPT,
} from './gc-minimal-zine-poster-v0-3';

export interface StyleSkill {
  id: string;
  name: string;
  systemPrompt: string;
}

export const STYLE_SKILLS: Record<string, StyleSkill> = {
  [SCENES_GATHERED_ZINE_ID]: {
    id: SCENES_GATHERED_ZINE_ID,
    name: SCENES_GATHERED_ZINE_NAME,
    systemPrompt: SCENES_GATHERED_ZINE_SKILL_PROMPT,
  },
  [GC_MINIMAL_ZINE_POSTER_ID]: {
    id: GC_MINIMAL_ZINE_POSTER_ID,
    name: GC_MINIMAL_ZINE_POSTER_NAME,
    systemPrompt: GC_MINIMAL_ZINE_POSTER_SKILL_PROMPT,
  },
};

export const DEFAULT_STYLE_SKILL: StyleSkill = STYLE_SKILLS[SCENES_GATHERED_ZINE_ID];

// 前端传入的 stylePreset 即风格 id；未识别时回退默认风格
export function resolveStyleSkill(stylePreset?: string): StyleSkill {
  return (stylePreset && STYLE_SKILLS[stylePreset]) || DEFAULT_STYLE_SKILL;
}
