# Netlifyへのデプロイガイド

## 概要
このプロジェクトはNetlify Functionsを使用してサーバーレス化されています。外部プラグインは不要です。

## デプロイ手順

### 1. Netlifyアカウントの作成
- [Netlify](https://netlify.com)にアクセス
- GitHubアカウントでサインアップ

### 2. リポジトリをGitHubにプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <https://github.com/kanata23njr250342-prog/site3-backend.git>
git push -u origin main
```

### 3. Netlifyでサイトを接続
1. Netlifyダッシュボードで「New site from Git」をクリック
2. GitHubリポジトリを選択
3. ビルド設定：
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. 「Deploy site」をクリック

### 4. デプロイ完了
- Netlifyが自動的にビルドとデプロイを実行
- サイトURLが表示されます

## 開発環境での実行

### ローカルサーバーの起動
```bash
# フロントエンド（ポート5173）
npm run dev

# バックエンド（ポート3000）
cd server
npm install
node server.js
```

### Netlify CLIでローカルテスト
```bash
npm install -g netlify-cli
netlify dev
```

## ファイル構造

```
site3/
├── src/
│   ├── api/
│   │   ├── notesApi.js      # メモAPI
│   │   └── postsApi.js      # 投稿作品API
│   ├── pages/
│   │   ├── Home.vue         # ホームページ
│   │   └── CategoryPage.vue  # カテゴリーページ
│   └── ...
├── netlify/
│   └── functions/           # Netlify Functions
│       ├── db.js            # データベース管理
│       ├── notes-get.js     # メモ取得
│       ├── notes-post.js    # メモ作成
│       ├── notes-put.js     # メモ更新
│       ├── notes-delete.js  # メモ削除
│       ├── posts-get.js     # 投稿作品取得
│       ├── posts-post.js    # 投稿作品作成
│       ├── posts-put.js     # 投稿作品更新
│       └── posts-delete.js  # 投稿作品削除
├── server/                  # ローカル開発用サーバー
├── netlify.toml            # Netlify設定
└── package.json
```

## API エンドポイント

### メモAPI
- `GET /api/notes/:category` - メモ取得
- `POST /api/notes` - メモ作成
- `PUT /api/notes/:id` - メモ更新
- `DELETE /api/notes/:id` - メモ削除

### 投稿作品API
- `GET /api/posts/:category` - 投稿作品取得
- `POST /api/posts` - 投稿作品作成（Base64形式）
- `PUT /api/posts/:id` - 投稿作品更新
- `DELETE /api/posts/:id` - 投稿作品削除

## 注意事項

### データ永続性
- Netlify Functionsはステートレスです
- 現在、データはメモリ上に保存されています
- 本番環境では、以下のサービスの使用を推奨：
  - Netlify Blobs（ファイルストレージ）
  - MongoDB、Firebase等のデータベース

### ファイルアップロード
- 投稿作品はBase64形式で送信されます
- メモリに保存されるため、大きなファイルは注意が必要です
- 本番環境ではクラウドストレージ（S3等）の使用を推奨

## トラブルシューティング

### 「サーバーが起動していない」エラー
- 開発環境：`npm run dev`と`node server.js`の両方が起動しているか確認
- 本番環境：Netlifyのビルドログを確認

### APIが404を返す
- `netlify.toml`のリダイレクト設定を確認
- Netlify Functionsのファイル名が正しいか確認

### ファイルアップロードが失敗する
- ブラウザコンソールでエラーメッセージを確認
- ファイルサイズが大きすぎないか確認
