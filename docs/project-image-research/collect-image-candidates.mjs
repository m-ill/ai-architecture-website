import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/assets/projects/source-candidates');
const docsDir = path.resolve('docs/project-image-research');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const queries = [
  { person: '김종호', project: '롯데월드타워', query: 'Lotte World Tower' },
  { person: '김종호', project: '서울 IFC', query: 'IFC Seoul towers' },
  { person: '김종호', project: '송도 더 퍼스트월드', query: 'Songdo First World' },
  { person: '정광량', project: '해운대 LCT', query: 'Haeundae LCT' },
  { person: '정광량', project: 'Northeast Asia Trade Tower', query: 'Northeast Asia Trade Tower' },
  { person: '정광량', project: 'Parc1 Tower', query: 'Parc1 Tower Seoul' },
  { person: '정광량', project: 'Keangnam Hanoi Landmark Tower', query: 'Keangnam Hanoi Landmark Tower' },
  { person: '김종수', project: 'Philippine Arena', query: 'Philippine Arena' },
  { person: '김종수', project: '전주월드컵경기장', query: 'Jeonju World Cup Stadium' },
  { person: '이상현', project: '아크로서울포레스트 D타워', query: 'Acro Seoul Forest D Tower' },
  { person: '이상현/정란', project: '테크노마트', query: 'Techno Mart Seoul' },
  { person: '위진복', project: '오사카 엑스포 한국관', query: 'Expo 2025 Korea Pavilion building' },
  { person: '위진복', project: 'Pi-ville 99', query: 'Pi-Ville 99 Seoul' },
  { person: '강태웅', project: '목조건축/목조주택 대체 이미지', query: 'Korean wooden house' }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function commonsSearch(query) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*'
  })}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Codex image research for educational website' }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  return Object.values(body.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
}

const manifest = [];

for (const item of queries) {
  try {
    const pages = await commonsSearch(item.query);
    const candidates = pages
      .map((page) => {
        const imageInfo = page.imageinfo?.[0] || {};
        const metadata = imageInfo.extmetadata || {};
        return {
          title: page.title,
          imageUrl: imageInfo.thumburl || imageInfo.url,
          originalUrl: imageInfo.url,
          descriptionUrl: imageInfo.descriptionurl,
          license: metadata.LicenseShortName?.value || '',
          usageTerms: stripHtml(metadata.UsageTerms?.value || ''),
          artist: stripHtml(metadata.Artist?.value || ''),
          credit: stripHtml(metadata.Credit?.value || ''),
          attributionRequired: metadata.AttributionRequired?.value || '',
          restrictions: stripHtml(metadata.Restrictions?.value || ''),
          categories: stripHtml(metadata.Categories?.value || '')
        };
      })
      .filter((candidate) => candidate.imageUrl && !/logo|icon|\.pdf/i.test(candidate.title));

    const selected = candidates[0] || null;
    let localFile = '';

    if (selected) {
      const pathname = new URL(selected.originalUrl || selected.imageUrl).pathname;
      const rawExt = path.extname(pathname).toLowerCase();
      const ext = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.jpg';
      const filename = `${slugify(item.project)}__commons-candidate${ext}`;
      const filePath = path.join(outDir, filename);
      const imageResponse = await fetch(selected.imageUrl, {
        headers: { 'User-Agent': 'Codex image research for educational website' }
      });

      if (imageResponse.ok) {
        fs.writeFileSync(filePath, Buffer.from(await imageResponse.arrayBuffer()));
        localFile = `public/assets/projects/source-candidates/${filename}`;
      }
    }

    manifest.push({
      ...item,
      source: 'Wikimedia Commons search',
      status: selected ? 'candidate_downloaded_check_license_and_fop' : 'no_commons_candidate',
      selected,
      localFile,
      candidates: candidates.slice(0, 4)
    });
  } catch (error) {
    manifest.push({
      ...item,
      source: 'Wikimedia Commons search',
      status: 'search_failed',
      error: String(error?.message || error)
    });
  }
}

fs.writeFileSync(
  path.join(docsDir, 'image-candidates.commons.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
);

console.log(JSON.stringify(
  manifest.map((item) => ({
    project: item.project,
    status: item.status,
    localFile: item.localFile,
    selected: item.selected?.title,
    license: item.selected?.license
  })),
  null,
  2
));
