import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = 'https://consumer.fda.gov.tw/Food';
const PAGE_COUNT = 222;
const MAX_ITEMS = 500;
const CONCURRENCY = 8;

const COMMON_FOOD_TERMS = [
  '白飯', '糙米', '紫米', '稀飯', '粥', '米粉', '冬粉', '麵', '水餃', '鍋貼',
  '饅頭', '吐司', '麵包', '貝果', '蛋糕', '餅乾', '燕麥', '麥片', '蛋',
  '豆腐', '豆干', '豆皮', '豆漿', '牛奶', '優酪乳', '優格', '起司', '乳酪',
  '雞胸', '雞腿', '雞翅', '雞肉', '豬肉', '里肌', '排骨', '牛肉', '羊肉',
  '鮭魚', '鯖魚', '鮪魚', '虱目魚', '鯛魚', '鱈魚', '蝦', '蛤', '牡蠣',
  '花枝', '透抽', '章魚', '高麗菜', '青江菜', '空心菜', '地瓜葉', '花椰菜',
  '菠菜', '萵苣', '番茄', '小黃瓜', '茄子', '蘿蔔', '菇', '豆芽', '洋蔥',
  '南瓜', '地瓜', '馬鈴薯', '芋頭', '玉米', '毛豆', '豌豆', '四季豆',
  '香蕉', '蘋果', '芭樂', '奇異果', '葡萄', '柳橙', '橘', '西瓜', '鳳梨',
  '芒果', '木瓜', '草莓', '藍莓', '梨', '桃', '柚', '檸檬', '酪梨',
  '花生', '杏仁', '腰果', '核桃', '芝麻', '堅果', '橄欖油', '沙拉油',
  '便當', '飯糰', '壽司', '漢堡', '披薩', '蘿蔔糕', '蔥油餅', '油條',
  '香腸', '火腿', '貢丸', '甜不辣', '關東煮', '泡麵', '布丁', '冰淇淋'
];

const decodeHtml = value => value
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const fetchText = async url => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Health-App nutrition data sync' }
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
};

const inBatches = async (items, worker) => {
  const results = [];
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    const batch = items.slice(index, index + CONCURRENCY);
    results.push(...await Promise.all(batch.map(worker)));
  }
  return results;
};

const parseList = html => {
  const matches = [...html.matchAll(
    /tfndDetail\.aspx\?nodeID=178(?:&amp;|&)f=0(?:&amp;|&)id=(\d+)"[^>]*title="([^"]+)"/g
  )];
  return matches.map(match => ({
    id: Number(match[1]),
    name: decodeHtml(match[2])
  }));
};

const readSpan = (html, id) => {
  const match = html.match(new RegExp(`<span id="${id}">([\\s\\S]*?)<\\/span>`));
  return match ? decodeHtml(match[1]) : '';
};

const parseNutrients = html => {
  const values = new Map();
  for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(match => decodeHtml(match[1]));
    if (cells.length >= 4) values.set(cells[1], Number.parseFloat(cells[3]));
  }
  return {
    calories: values.get('熱量'),
    protein: values.get('粗蛋白'),
    carbs: values.get('總碳水化合物'),
    fat: values.get('粗脂肪'),
    fiber: values.get('膳食纖維')
  };
};

const scoreFood = food => {
  const matchingTerms = COMMON_FOOD_TERMS.filter(term => food.name.includes(term));
  if (matchingTerms.length === 0) return -1;
  let score = matchingTerms.reduce((total, term) => total + term.length * 10, 0);
  if (COMMON_FOOD_TERMS.includes(food.name)) score += 100;
  if (/熟|煮|蒸|烤|滷|炒|炸|即食/.test(food.name)) score += 20;
  if (/\(.*\)|嬰兒|配方|粉末|脫水|罐頭/.test(food.name)) score -= 15;
  score -= food.name.length;
  return score;
};

const pages = Array.from({ length: PAGE_COUNT }, (_, index) => index + 1);
const pageHtml = await inBatches(
  pages,
  page => fetchText(`${BASE_URL}/TFND.aspx?nodeID=178&p=${page}`)
);
const allFoods = [...new Map(
  pageHtml.flatMap(parseList).map(food => [food.id, food])
).values()];

const selected = allFoods
  .map(food => ({ ...food, score: scoreFood(food) }))
  .filter(food => food.score >= 0)
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hant'))
  .slice(0, MAX_ITEMS);

const details = await inBatches(selected, async food => {
  const sourceUrl = `${BASE_URL}/tfndDetail.aspx?nodeID=178&f=0&id=${food.id}`;
  const html = await fetchText(sourceUrl);
  const nutritionPer100g = parseNutrients(html);
  if (Object.values(nutritionPer100g).some(value => !Number.isFinite(value))) return null;
  const aliases = readSpan(html, 'ctl00_content_lbTrivialName')
    .split(/[,、;]/)
    .map(alias => alias.trim())
    .filter(Boolean);
  return {
    id: food.id,
    code: readSpan(html, 'ctl00_content_lbIntNo'),
    name: readSpan(html, 'ctl00_content_lbFoodName') || food.name,
    aliases,
    description: readSpan(html, 'ctl00_content_lbContent'),
    nutritionPer100g,
    sourceUrl
  };
});

const dataset = {
  source: '衛生福利部食品藥物管理署 食品營養成分資料庫',
  sourceHome: 'https://consumer.fda.gov.tw/Food/TFND.aspx?nodeID=178',
  generatedAt: new Date().toISOString(),
  itemCount: details.filter(Boolean).length,
  items: details.filter(Boolean)
};

const outputPath = resolve('src/data/taiwanNutrition.json');
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${dataset.itemCount} items to ${outputPath}\n`);
