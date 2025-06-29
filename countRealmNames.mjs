// file: countRealmNames.mjs
import { readFile } from 'node:fs/promises';

async function main() {
  // 1) 데이터 읽기
  const raw = await readFile('./freeculture_data.json', 'utf-8');
  const rows = JSON.parse(raw);

  // 2) realmName별 카운트 집계
  const counter = new Map(); // Map<realmName, count>
  for (const { realmName } of rows) {
    if (!realmName) continue;
    const key = realmName.trim();
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  // 3) 정렬: count ↓, 동일하면 가나다순 ↑
  const sorted = [...counter.entries()]
    .sort((a, b) => {
      const diff = b[1] - a[1];      // 개수 내림차순
      return diff || a[0].localeCompare(b[0], 'ko'); // 동률이면 이름순
    });

  // 4) 보기 좋은 형태로 변환
  const result = sorted.map(([realmName, count]) => ({ realmName, count }));

  // 5) 출력
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
