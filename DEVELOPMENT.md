# 開発ガイド

このドキュメントは、プロジェクトの開発に関する情報を提供します。

## コード品質管理

### ESLint の使用

このプロジェクトでは ESLint を使用してコード品質を管理しています。

#### チェック実行
```bash
npm run lint
```

#### 自動修正
```bash
npm run lint:fix
```

### ESLint ルール

主要なルール：
- `no-undef` - 未定義の変数を検出
- `no-unused-vars` - 未使用の変数を検出
- `prefer-const` - `const` の使用を推奨
- `eqeqeq` - 厳密な等価比較（===）を強制
- `vue/require-v-for-key` - v-for に key を強制

詳細は `eslint.config.js` を参照してください。

## 型安全性

### JSDoc コメント

すべての関数には JSDoc コメントを付与してください。

```javascript
/**
 * 関数の説明
 * @param {type} paramName - パラメータの説明
 * @returns {type} 戻り値の説明
 */
function myFunction(paramName) {
  // 実装
}
```

### 型定義

共通の型定義は `src/types/index.js` に記述してください。

```javascript
/**
 * @typedef {Object} MyType
 * @property {string} id - IDの説明
 * @property {number} value - 値の説明
 */
```

## コミット前のチェックリスト

1. `npm run lint` でエラーがないか確認
2. `npm run lint:fix` で自動修正を実行
3. ブラウザのコンソールにエラーがないか確認
4. 新しい関数には JSDoc コメントを追加
5. 関連する型定義を `src/types/index.js` に追加

## トラブルシューティング

### ESLint が動作しない場合

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run lint -- --cache-location=.eslintcache --cache
```

### VSCode で ESLint 拡張機能を使用する場合

1. VSCode に "ESLint" 拡張機能をインストール
2. `.vscode/settings.json` に以下を追加：

```json
{
  "eslint.validate": [
    "javascript",
    "vue"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 参考リンク

- [ESLint 公式ドキュメント](https://eslint.org/)
- [eslint-plugin-vue](https://eslint.vuejs.org/)
- [JSDoc](https://jsdoc.app/)
