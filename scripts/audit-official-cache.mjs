// Read only: inspect an explicitly supplied Chromium cache entry containing
// an official Figma English locale response. No profile or user data is read.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dictionary=Object.assign({}, ...['lang.cn.json','lang.cn.menu.json'].map(name=>JSON.parse(fs.readFileSync(path.join(root,'src/translation-loader/js',name),'utf8'))));
const keys=new Set(Object.keys(dictionary).map(k=>k.toLowerCase()));
for(const file of process.argv.slice(2)){
  const bytes=fs.readFileSync(file);
  const length=bytes.readUInt32LE(12);
  const url=bytes.subarray(24,24+length).toString().replace(/^\d+\/\d+\//,'');
  if(!/^https:\/\/www\.figma\.com\/webpack-artifacts\/assets\/[\w.-]+\.en\.json\.br$/.test(url))throw new Error('Not an official English locale cache entry');
  const data=JSON.parse(zlib.brotliDecompressSync(bytes.subarray(24+length)));
  const entries=Object.entries(data).filter(([,v])=>typeof v?.string==='string');
  const unique=[...new Set(entries.map(([,v])=>v.string))];
  const unmatched=entries.filter(([,v])=>!keys.has(v.string.toLowerCase()));
  console.log(JSON.stringify({source:url,languageKeys:entries.length,uniqueStrings:unique.length,
    exactUnmatchedStrings:unique.filter(s=>!keys.has(s.toLowerCase())).length,
    note:'Exact dictionary comparison only; runtime rules and intentional English names require review.',
    unmatched:unmatched.map(([key,v])=>({key,source:v.string}))},null,2));
}
