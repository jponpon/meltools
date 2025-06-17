// Supabase接続設定
// Netlifyの環境変数から値を取得（ビルド時に置換される）
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// デバッグ用：接続情報を確認
console.log('Supabase URL:', SUPABASE_URL);
console.log('URL is valid:', SUPABASE_URL.startsWith('https://'));

// Supabaseクライアントの初期化（エラーハンドリング付き）
let supabase;
try {
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        throw new Error('Supabase URLが設定されていません。Netlifyの環境変数を確認してください。');
    }
    if (!SUPABASE_KEY || SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        throw new Error('Supabase Anon Keyが設定されていません。Netlifyの環境変数を確認してください。');
    }
    
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (error) {
    console.error('Supabase初期化エラー:', error);
    // エラーメッセージを画面に表示
    document.addEventListener('DOMContentLoaded', () => {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error-message');
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
        errorElement.innerHTML = `
            <strong>初期化エラー:</strong><br>
            ${error.message}<br><br>
            <small>Netlifyダッシュボードで以下の環境変数を設定してください：<br>
            - SUPABASE_URL<br>
            - SUPABASE_ANON_KEY</small>
        `;
    });
}

/**
 * ページ読み込み時の処理
 */
document.addEventListener('DOMContentLoaded', () => {
    // 商品データを取得して表示
    loadProducts();
    
    // Enterキーでカスタムポイントを追加できるようにする
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('custom-input')) {
            e.preventDefault();
            const cardId = e.target.id.replace('-custom-text', '');
            addCustomPoint(cardId);
        }
    });
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
    
    // ユニークなIDを生成
    const cardId = `card-${product.id || Math.random().toString(36).substr(2, 9)}`;
    
    // カードの内容を構築
    card.innerHTML = `
        <h3>${escapeHtml(product.name)}</h3>
        <a href="${escapeHtml(product.mercari_url)}" target="_blank" rel="noopener noreferrer">
            メルカリで検索 →
        </a>
        
        <div class="prompt-settings">
            <div class="setting-group">
                <label>状態：</label>
                <select id="${cardId}-condition" class="condition-select">
                    <option value="新品・未使用">新品・未使用</option>
                    <option value="未使用に近い">未使用に近い</option>
                    <option value="良好、中古美品" selected>良好、中古美品</option>
                    <option value="やや傷あり">やや傷あり</option>
                    <option value="傷あり">傷あり</option>
                    <option value="ジャンク品">ジャンク品</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label>テンプレート：</label>
                <select id="${cardId}-template" class="template-select" onchange="applyTemplate('${cardId}', this.value)">
                    <option value="">選択してください</option>
                    <option value="electronics">電子機器（スマホ・PC等）</option>
                    <option value="fashion">ファッション・衣類</option>
                    <option value="books">本・マンガ</option>
                    <option value="toys">おもちゃ・ゲーム</option>
                    <option value="cosmetics">コスメ・美容</option>
                    <option value="general">雑貨・日用品</option>
                    <option value="tradingcard">トレーディングカード</option>
                    <option value="custom">その他（カスタム）</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label>ポイント：</label>
                <div id="${cardId}-points" class="point-checkboxes">
                    <label class="checkbox-label">
                        <input type="checkbox" value="動作確認済" checked> 動作確認済
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="傷なし" checked> 傷なし
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="即発送可能" checked> 即発送可能
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="箱・付属品完備"> 箱・付属品完備
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="クリーニング済"> クリーニング済
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" value="ペット・喫煙者なし"> ペット・喫煙者なし
                    </label>
                </div>
                <div id="${cardId}-custom-input" class="custom-point-input" style="display: none;">
                    <input type="text" id="${cardId}-custom-text" placeholder="カスタムポイントを入力（例：限定品）" class="custom-input">
                    <button onclick="addCustomPoint('${cardId}')" class="add-button">追加</button>
                </div>
            </div>
        </div>
        
        <button class="copy-button" onclick="copyPromptWithSettings('${escapeHtml(product.name)}', '${cardId}', this)">
            出品用プロンプトをコピー
        </button>
    `;
    
    return card;
}

/**
 * 設定を含む出品用プロンプトを生成してクリップボードにコピー
 * @param {string} productName - 商品名
 * @param {string} cardId - カードのID
 * @param {HTMLElement} button - クリックされたボタン要素
 */
async function copyPromptWithSettings(productName, cardId, button) {
    // 状態を取得
    const conditionSelect = document.getElementById(`${cardId}-condition`);
    const condition = conditionSelect.value;
    
    // チェックされたポイントを取得
    const card = button.closest('.item-card');
    const checkedPoints = [];
    card.querySelectorAll('.point-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
        checkedPoints.push(checkbox.value);
    });
    
    // ポイントを文字列に変換
    const pointsStr = checkedPoints.length > 0 ? checkedPoints.join('、') : 'なし';
    
    // プロンプトテンプレートを生成
    const prompt = `以下の商品をメルカリで魅力的に出品するための商品説明文を作ってください。
商品名：${productName}
状態：${condition}
ポイント：${pointsStr}`;
    
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

// 古い関数も互換性のために残す
async function copyPrompt(productName, button) {
    const prompt = `以下の商品をメルカリで魅力的に出品するための商品説明文を作ってください。
商品名：${productName}
状態：良好、中古美品
ポイント：動作確認済、傷なし、即発送可能`;
    
    try {
        await navigator.clipboard.writeText(prompt);
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
 * カテゴリー別のポイントテンプレート
 */
const pointTemplates = {
    electronics: [
        '動作確認済',
        '初期化済',
        'バッテリー良好',
        '箱・付属品完備',
        '保証書あり',
        '即発送可能'
    ],
    fashion: [
        'クリーニング済',
        'ペット・喫煙者なし',
        'サイズ表記あり',
        'ブランド正規品',
        '色褪せなし',
        '即発送可能'
    ],
    books: [
        '書き込みなし',
        '日焼けなし',
        'ペット・喫煙者なし',
        '帯付き',
        '初版',
        '即発送可能'
    ],
    toys: [
        '動作確認済',
        '説明書付き',
        '箱あり',
        'パーツ完備',
        'クリーニング済',
        '即発送可能'
    ],
    cosmetics: [
        '残量9割以上',
        '使用期限内',
        '箱あり',
        '正規品',
        'パッチテスト済',
        '即発送可能'
    ],
    general: [
        '傷なし',
        'クリーニング済',
        'ペット・喫煙者なし',
        '動作確認済',
        '箱あり',
        '即発送可能'
    ],
    tradingcard: [
        '美品',
        'スリーブ保管',
        '折れ・傷なし',
        '防水対策して発送',
        'トップローダー使用',
        '即発送可能'
    ]
};

/**
 * テンプレートを適用
 * @param {string} cardId - カードのID
 * @param {string} templateType - テンプレートの種類
 */
function applyTemplate(cardId, templateType) {
    const pointsContainer = document.getElementById(`${cardId}-points`);
    const customInput = document.getElementById(`${cardId}-custom-input`);
    
    // カスタムの場合は入力欄を表示
    if (templateType === 'custom') {
        customInput.style.display = 'flex';
        // 既存のチェックボックスをクリア
        pointsContainer.innerHTML = '';
        // 基本的なポイントだけ追加
        const basicPoints = ['即発送可能', '丁寧な梱包'];
        basicPoints.forEach(point => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" value="${point}" checked> ${point}
            `;
            pointsContainer.appendChild(label);
        });
        return;
    }
    
    // カスタム入力欄を非表示
    customInput.style.display = 'none';
    
    if (!templateType || !pointTemplates[templateType]) return;
    
    const template = pointTemplates[templateType];
    
    // 既存のチェックボックスをクリア
    pointsContainer.innerHTML = '';
    
    // 新しいチェックボックスを作成
    template.forEach((point, index) => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${point}" ${index < 3 ? 'checked' : ''}> ${point}
        `;
        pointsContainer.appendChild(label);
    });
}

/**
 * カスタムポイントを追加
 * @param {string} cardId - カードのID
 */
function addCustomPoint(cardId) {
    const customInput = document.getElementById(`${cardId}-custom-text`);
    const pointsContainer = document.getElementById(`${cardId}-points`);
    const customText = customInput.value.trim();
    
    if (!customText) return;
    
    // 新しいチェックボックスを作成
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    label.innerHTML = `
        <input type="checkbox" value="${escapeHtml(customText)}" checked> ${escapeHtml(customText)}
    `;
    pointsContainer.appendChild(label);
    
    // 入力欄をクリア
    customInput.value = '';
    
    // フォーカスを戻す
    customInput.focus();
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