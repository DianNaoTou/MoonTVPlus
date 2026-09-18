import fs from 'node:fs';
import path from 'node:path';

const roots = ['src/app', 'src/components'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const mainlandTerms = [
  '搜索',
  '视频',
  '用户',
  '登录',
  '注册',
  '设置',
  '默认',
  '配置',
  '保存',
  '加载',
  '文件',
  '文件夹',
  '数据',
  '信息',
  '消息',
  '网络',
  '服务器',
  '软件',
  '硬件',
  '缓存',
  '刷新',
  '添加',
  '创建',
  '获取',
  '链接',
  '点击',
  '粘贴',
  '全屏',
  '实时',
  '反馈',
  '支持',
  '设备',
  '本地',
  '远程',
  '高级',
];

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === path.join('src', 'app', 'api')) continue;
      walk(fullPath, files);
    } else if (extensions.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

const findings = [];
for (const file of roots.flatMap((root) => walk(root))) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let count = 0;
  lines.forEach((line, index) => {
    const matched = mainlandTerms.filter((term) => line.includes(term));
    if (matched.length === 0) return;
    count += matched.length;
    findings.push({ file, line: index + 1, terms: matched });
  });
  if (count === 0) continue;
}

const byFile = new Map();
for (const finding of findings) {
  byFile.set(
    finding.file,
    (byFile.get(finding.file) || 0) + finding.terms.length
  );
}

const summary = [...byFile.entries()].sort((a, b) => b[1] - a[1]);
console.log(
  `zh-TW audit candidates: ${findings.length} lines in ${summary.length} files`
);
for (const [file, count] of summary)
  console.log(`${String(count).padStart(4)}  ${file}`);
console.log(
  '\nNote: candidates include comments and logic values. User-visible legacy text is localized by the zh-TW compatibility layer; review this list when migrating components to t().'
);
