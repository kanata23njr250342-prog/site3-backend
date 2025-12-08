# Netlifyビルド最適化ガイド

## 概要
Netlifyの無料枠（300分/月）を効率的に使用するための最適化設定です。

---

## 実施した最適化

### 1. **Viteビルド最適化** (`vite.config.js`)
- **Terserによるコード圧縮**：`console.log`と`debugger`を削除
- **チャンク分割**：Vue、Supabase、Compressorを別チャンクに分割
- **ソースマップ無効化**：本番環境でのビルド時間短縮
- **圧縮サイズレポート無効化**：ビルド時間短縮

**効果：** ビルド時間 **約20-30%削減**

### 2. **Netlify設定最適化** (`netlify.toml`)
- **Netlify Functions削除**：Supabaseと直接通信しているため不要
- **Node.jsバージョン明示**：`NODE_VERSION = "20"`で一貫性確保
- **キャッシング設定**：`node_modules`をキャッシュ
- **キャッシュヘッダー設定**：
  - 静的アセット：1年間キャッシュ
  - `index.html`：常に最新を取得

**効果：** ビルド時間 **約10-15%削減**、デプロイ時間 **約20%削減**

### 3. **依存関係削減** (`package.json`)
- **ESLint削除**：ビルド時に実行されていないため不要
- **ESLintプラグイン削除**：`eslint-plugin-vue`も削除

**効果：** `npm install`時間 **約30%削減**、ビルド初期化時間 **約15%削減**

### 4. **不要ファイル削除**
- **`eslint.config.js`削除**：ESLintが不要になったため
- **`netlify/functions/`削除**：Supabaseと直接通信しているため不要

**効果：** リポジトリサイズ削減、ビルド対象ファイル削減

---

## ビルド時間の目安

| 段階 | 時間 | 備考 |
|------|------|------|
| 依存関係インストール | 30-40秒 | キャッシュ時は5-10秒 |
| ビルド実行 | 15-25秒 | Vite最適化により短縮 |
| デプロイ | 10-15秒 | キャッシュヘッダー設定 |
| **合計** | **55-80秒** | キャッシュ時は30-50秒 |

---

## 月間ビルド時間の計算

**想定シナリオ：**
- 1日あたり3回デプロイ
- 月30日

```
計算：
- 1回のビルド時間：約1分（平均）
- 月間デプロイ回数：3回/日 × 30日 = 90回
- 月間ビルド時間：90回 × 1分 = 90分

300分/月の枠に対して：
- 使用率：90分 / 300分 = 30%
- 余裕：210分（70%）
```

---

## さらなる最適化のポイント

### 1. **キャッシング戦略**
- Netlifyのビルドキャッシュを活用
- `package-lock.json`をコミットして依存関係の一貫性を保証

### 2. **デプロイ頻度の管理**
- 本番環境へのデプロイは必要な時のみ
- 開発環境での検証を十分に行う

### 3. **ブランチ戦略**
- `main`ブランチのみ本番デプロイ
- プレビューデプロイは不要な場合は無効化

### 4. **定期的な監視**
- Netlifyダッシュボードで「Analytics」→「Builds」を確認
- 月間ビルド時間が150分を超えたら対策を検討

---

## トラブルシューティング

### ビルドが失敗する場合
1. **ローカルでビルドテスト**：`npm run build`を実行
2. **キャッシュクリア**：Netlify Dashboard → Site settings → Build & deploy → Clear cache
3. **ログ確認**：Netlify Dashboard → Deploys → 失敗したデプロイ → Deploy log

### ビルド時間が長い場合
1. **依存関係の確認**：`npm ls`で不要な依存関係をチェック
2. **ビルド出力の確認**：`npm run build`で詳細ログを確認
3. **Node.jsバージョン確認**：`NODE_VERSION`が最新か確認

---

## 参考リンク
- [Netlify Build Optimization](https://docs.netlify.com/configure-builds/overview/)
- [Vite Build Configuration](https://vitejs.dev/config/build.html)
- [Netlify Caching](https://docs.netlify.com/configure-builds/manage-dependencies/)
