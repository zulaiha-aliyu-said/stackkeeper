import { Tool, Category, Platform } from '@/types/tool';

const categories: Category[] = ['Marketing', 'Design', 'Productivity', 'AI', 'Dev Tools', 'Analytics', 'Email', 'Video', 'Other'];
const platforms: Platform[] = ['AppSumo', 'PitchGround', 'DealFuel', 'StackSocial', 'Other'];

const toolNames = [
  // AI Tools (12)
  { name: 'Jasper AI', category: 'AI' as Category, annualValue: 588, price: 59 },
  { name: 'Copy.ai', category: 'AI' as Category, annualValue: 432, price: 49 },
  { name: 'Writesonic', category: 'AI' as Category, annualValue: 228, price: 69 },
  { name: 'Peppertype.ai', category: 'AI' as Category, annualValue: 300, price: 39 },
  { name: 'Rytr', category: 'AI' as Category, annualValue: 348, price: 29 },
  { name: 'Frase.io', category: 'AI' as Category, annualValue: 540, price: 79 },
  { name: 'Surfer SEO', category: 'AI' as Category, annualValue: 1188, price: 99 },
  { name: 'NeuronWriter', category: 'AI' as Category, annualValue: 228, price: 69 },
  { name: 'Pictory AI', category: 'AI' as Category, annualValue: 228, price: 47 },
  { name: 'Synthesia', category: 'AI' as Category, annualValue: 264, price: 89 },
  { name: 'Descript', category: 'AI' as Category, annualValue: 288, price: 49 },
  { name: 'Murf AI', category: 'AI' as Category, annualValue: 228, price: 59 },
  
  // Marketing (8)
  { name: 'ltd Plus', category: 'Marketing' as Category, annualValue: 99, price: 99 },
  { name: 'TubeBuddy', category: 'Marketing' as Category, annualValue: 108, price: 49 },
  { name: 'VidIQ', category: 'Marketing' as Category, annualValue: 90, price: 39 },
  { name: 'Missinglettr', category: 'Marketing' as Category, annualValue: 228, price: 59 },
  { name: 'Publer', category: 'Marketing' as Category, annualValue: 228, price: 49 },
  { name: 'SocialBee', category: 'Marketing' as Category, annualValue: 228, price: 49 },
  { name: 'Crowdfire', category: 'Marketing' as Category, annualValue: 118, price: 49 },
  { name: 'Hypefury', category: 'Marketing' as Category, annualValue: 228, price: 49 },
  
  // Design (7)
  { name: 'Designrr', category: 'Design' as Category, annualValue: 348, price: 47 },
  { name: 'Visme', category: 'Design' as Category, annualValue: 348, price: 99 },
  { name: 'Snappa', category: 'Design' as Category, annualValue: 180, price: 49 },
  { name: 'Glorify', category: 'Design' as Category, annualValue: 468, price: 59 },
  { name: 'Crello Pro', category: 'Design' as Category, annualValue: 96, price: 49 },
  { name: 'Stencil', category: 'Design' as Category, annualValue: 144, price: 49 },
  { name: 'RelayThat', category: 'Design' as Category, annualValue: 228, price: 49 },
  
  // Productivity (6)
  { name: 'Notion', category: 'Productivity' as Category, annualValue: 96, price: 0 },
  { name: 'ClickUp', category: 'Productivity' as Category, annualValue: 84, price: 99 },
  { name: 'Taskade', category: 'Productivity' as Category, annualValue: 60, price: 39 },
  { name: 'Coda', category: 'Productivity' as Category, annualValue: 120, price: 79 },
  { name: 'Fibery', category: 'Productivity' as Category, annualValue: 180, price: 99 },
  { name: 'Supernotes', category: 'Productivity' as Category, annualValue: 96, price: 49 },
  
  // Dev Tools (5)
  { name: 'Retool', category: 'Dev Tools' as Category, annualValue: 600, price: 199 },
  { name: 'Budibase', category: 'Dev Tools' as Category, annualValue: 300, price: 79 },
  { name: 'Appsmith', category: 'Dev Tools' as Category, annualValue: 480, price: 149 },
  { name: 'Directus', category: 'Dev Tools' as Category, annualValue: 180, price: 99 },
  { name: 'n8n', category: 'Dev Tools' as Category, annualValue: 240, price: 99 },
  
  // Analytics (4)
  { name: 'Plausible', category: 'Analytics' as Category, annualValue: 108, price: 89 },
  { name: 'Fathom', category: 'Analytics' as Category, annualValue: 168, price: 99 },
  { name: 'Simple Analytics', category: 'Analytics' as Category, annualValue: 108, price: 79 },
  { name: 'Pirsch', category: 'Analytics' as Category, annualValue: 60, price: 49 },
  
  // Email (3)
  { name: 'SendFox', category: 'Email' as Category, annualValue: 0, price: 49 },
  { name: 'Mailerlite', category: 'Email' as Category, annualValue: 108, price: 0 },
  { name: 'ConvertKit', category: 'Email' as Category, annualValue: 348, price: 79 },
  
  // Video (2)
  { name: 'Loom', category: 'Video' as Category, annualValue: 150, price: 99 },
  { name: 'Screencast-O-Matic', category: 'Video' as Category, annualValue: 72, price: 39 },
];

function getRandomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function getRandomUsageHistory(timesUsed: number): { timestamp: string; source: 'manual' | 'timer' | 'extension' | 'daily-prompt'; id: string; duration?: number }[] {
  const history = [];
  for (let i = 0; i < timesUsed; i++) {
    history.push({
      id: `usage-${i}`,
      timestamp: getRandomDate(Math.floor(Math.random() * 60)),
      source: (['manual', 'timer', 'extension', 'daily-prompt'] as const)[Math.floor(Math.random() * 4)],
      duration: Math.floor(Math.random() * 3600) + 300, // 5min to 1hr
    });
  }
  return history;
}

export function generateDemoTools(): Tool[] {
  return toolNames.map((tool, index) => {
    const daysAgo = Math.floor(Math.random() * 365) + 30;
    const timesUsed = index < 25 ? Math.floor(Math.random() * 50) + 1 : 0; // First 25 tools have usage, rest are "graveyard"
    const hasStreak = timesUsed > 5;
    
    return {
      id: `demo-${index}`,
      name: tool.name,
      category: tool.category,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      price: tool.price,
      purchaseDate: getRandomDate(daysAgo),
      addedDate: getRandomDate(daysAgo - 5),
      lastUsed: timesUsed > 0 ? getRandomDate(Math.floor(Math.random() * 14)) : null,
      timesUsed,
      annualValue: tool.annualValue,
      currentStreak: hasStreak ? Math.floor(Math.random() * 7) + 1 : 0,
      longestStreak: hasStreak ? Math.floor(Math.random() * 14) + 3 : 0,
      usageHistory: getRandomUsageHistory(timesUsed),
      tags: index % 3 === 0 ? ['favorite'] : index % 5 === 0 ? ['review'] : [],
      toolUrl: `https://${tool.name.toLowerCase().replace(/\s+/g, '')}.com`,
    };
  });
}

export const DEMO_TOOLS_COUNT = toolNames.length; // 47 tools
