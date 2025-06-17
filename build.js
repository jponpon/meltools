const fs = require('fs');
const path = require('path');

// 現在のタイムスタンプを取得（キャッシュバスティング用）
const timestamp = new Date().getTime();

// distディレクトリを作成
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// script.jsを読み込んで環境変数を置換
let scriptContent = fs.readFileSync('script.js', 'utf8');

// 環境変数を置換
scriptContent = scriptContent.replace(
    "process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'",
    `'${process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'}'`
);

scriptContent = scriptContent.replace(
    "process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'",
    `'${process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'}'`
);

// index.htmlを読み込んでタイムスタンプを追加
let htmlContent = fs.readFileSync('index.html', 'utf8');

// CSSとJSのリンクにタイムスタンプを追加
htmlContent = htmlContent.replace('style.css?v=1.0', `style.css?v=${timestamp}`);
htmlContent = htmlContent.replace('script.js?v=1.0', `script.js?v=${timestamp}`);

// distディレクトリに書き込み
fs.writeFileSync(path.join(distDir, 'script.js'), scriptContent);
fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
fs.copyFileSync('style.css', path.join(distDir, 'style.css'));

console.log('ビルド完了！');
console.log(`タイムスタンプ: ${timestamp}`);
console.log('環境変数:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '設定済み' : '未設定');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '設定済み' : '未設定');