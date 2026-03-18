import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const KEY = process.env.FREE_CULTURE_API_KEY;
const LIST = 'https://apis.data.go.kr/B553457/cultureinfo/period2';
const DETAIL = 'https://apis.data.go.kr/B553457/cultureinfo/detail2';
const ROWS = 1000;

async function seqList() {
  const { data } = await axios.get(LIST, {
    params: { serviceKey: KEY, PageNo: 1, numOfrows: ROWS },
    responseType: 'text',
  });

  console.log(data);

  const total = +data.match(/<totalCount>(\d+)<\/totalCount>/)[1];
  const pages = Math.ceil(total / ROWS);
  let seqs = [...data.matchAll(/<seq>(\d+)<\/seq>/g)].map(m => m[1]);

  for (let p = 2; p <= pages; p++) {
    const { data } = await axios.get(LIST, {
      params: { serviceKey: KEY, PageNo: p, numOfrows: ROWS },
      responseType: 'text',
    });
    seqs = seqs.concat([...data.matchAll(/<seq>(\d+)<\/seq>/g)].map(m => m[1]));
  }

  return seqs;
}

function xmlToJson(xml) {
  const obj = {};
  for (const m of xml.matchAll(/<([^/][^>]*)>(.*?)<\/\1>/g))
    obj[m[1]] = m[2];
  return obj;
}

async function fetchDetail(seq, index, total) {
  try {
    const { data } = await axios.get(DETAIL, {
      params: { serviceKey: KEY, seq },
      responseType: 'text',
    });
    const inner = data.match(/<item>([\s\S]*?)<\/item>/);
    console.log(`📦 [${index + 1}/${total}] seq=${seq}`);
    return xmlToJson(inner ? inner[1] : '');
  } catch (err) {
    console.error(`❌ 오류 발생: seq=${seq}`, err.message);
    return null;
  }
}

(async () => {
  console.log('📥 seq 목록 수집…');
  const seqs = await seqList();
  console.log(`🔍 총 ${seqs.length}건`);

  const details = [];

  for (let i = 0; i < seqs.length; i++) {
    const detail = await fetchDetail(seqs[i], i, seqs.length);
    if (detail) details.push(detail);
    await new Promise(r => setTimeout(r, 350)); // 초당 3건 제한 (350ms는 여유용)
  }

  const outputDir = path.join(process.cwd(), 'public');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'freeculture_data.json');
  await fs.writeFile(outputPath, JSON.stringify(details, null, 2));
  console.log('✅ 저장 완료!');
})();
