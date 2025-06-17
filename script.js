// Supabase接続設定
// Netlifyの環境変数から値を取得（ビルド時に置換される）
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Supabaseクライアントの初期化
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * ページ読み込み時の処理
 */
document.addEventListener('DOMContentLoaded', () => {
    // 商品データを取得して表示
    loadProducts();
});

/**
 * Supabaseから商品データを取得して表示
 */
async function loadProducts() {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const itemListElement = document.getElementById('item-list');
    
    try {
        // Supabaseから商品データを取得（キャッシュ無効化）
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        // ローディング表示を非表示
        loadingElement.style.display = 'none';
        
        // 既存の内容を必ずクリア
        itemListElement.innerHTML = '';
        
        if (data && data.length > 0) {
            // 商品データを表示
            displayProducts(data);
        } else {
            // データがない場合のメッセージ
            itemListElement.innerHTML = '<p style="text-align: center; color: #666;">商品データがありません</p>';
        }
        
    } catch (error) {
        // エラー処理
        console.error('データ取得エラー:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.textContent = `エラーが発生しました: ${error.message}`;
    }
}

/**
 * 商品データをHTMLに表示
 * @param {Array} products - 商品データの配列
 */
function displayProducts(products) {
    const itemListElement = document.getElementById('item-list');
    
    // 既存の内容をクリア
    itemListElement.innerHTML = '';
    
    // 各商品のカードを作成
    products.forEach(product => {
        const card = createProductCard(product);
        itemListElement.appendChild(card);
    });
}

/**
 * 商品カードのHTML要素を作成
 * @param {Object} product - 商品データ
 * @returns {HTMLElement} 商品カード要素
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'item-card';
    
    // カードの内容を構築
    card.innerHTML = `
        <h3>${escapeHtml(product.name)}</h3>
        <a href="${escapeHtml(product.mercari_url)}" target="_blank" rel="noopener noreferrer">
            メルカリで検索 →
        </a>
        <button class="copy-button" onclick="copyPrompt('${escapeHtml(product.name)}', this)">
            出品用プロンプトをコピー
        </button>
    `;
    
    return card;
}

/**
 * 出品用プロンプトを生成してクリップボードにコピー
 * @param {string} productName - 商品名
 * @param {HTMLElement} button - クリックされたボタン要素
 */
async function copyPrompt(productName, button) {
    // プロンプトテンプレートを生成
    const prompt = `以下の商品をメルカリで魅力的に出品するための商品説明文を作ってください。
商品名：${productName}
状態：良好、中古美品
ポイント：動作確認済、傷なし、即発送可能`;
    
    try {
        // クリップボードにコピー
        await navigator.clipboard.writeText(prompt);
        
        // 成功フィードバック
        showCopySuccess(button);
        
    } catch (error) {
        console.error('コピーエラー:', error);
        alert('クリップボードへのコピーに失敗しました');
    }
}

/**
 * コピー成功時のフィードバック表示
 * @param {HTMLElement} button - ボタン要素
 */
function showCopySuccess(button) {
    const originalText = button.textContent;
    
    // ボタンのテキストと色を変更
    button.textContent = 'コピーしました！';
    button.classList.add('success');
    
    // 2秒後に元に戻す
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
    }, 2000);
}

/**
 * HTMLエスケープ処理
 * @param {string} text - エスケープする文字列
 * @returns {string} エスケープ済み文字列
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * デバッグ用: Supabase接続テスト
 * コンソールで testConnection() を実行して接続を確認できます
 */
window.testConnection = async function() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count');
            
        if (error) {
            console.error('接続エラー:', error);
        } else {
            console.log('Supabase接続成功！');
        }
    } catch (e) {
        console.error('接続テスト失敗:', e);
    }
}