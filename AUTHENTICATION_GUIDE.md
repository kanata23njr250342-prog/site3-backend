# ユーザー認証システム実装ガイド

## 概要

自他選別機能を実装するため、シンプルなセッションベースのユーザー認証システムを構築しました。

## システム構成

### 1. **フロントエンド認証 (`src/utils/auth.js`)**

#### ユーザーID管理
```javascript
// ユーザーIDの自動生成と保存
const userId = getCurrentUserId()
// 例: "user_1764989390982_a1b2c3d4e"
```

**特徴：**
- ブラウザのローカルストレージに保存
- 初回アクセス時に自動生成
- 同じブラウザでは同じIDが使用される

#### ユーザー名管理
```javascript
// ユーザー名の設定
setCurrentUserName('ユーザー名')

// ユーザー名の取得
const name = getCurrentUserName() // デフォルト: '匿名'
```

#### 自他判定
```javascript
// 指定されたユーザーIDが現在のユーザーのものか確認
if (isCurrentUser(note.authorId)) {
  // 自分のメモ → 編集・削除可能
}
```

### 2. **API通信の改善**

#### メモAPI (`src/api/notesApi.js`)
```javascript
// メモ作成時に自動的にユーザーIDを追加
const dataWithUserId = {
  ...noteData,
  authorId: getCurrentUserId()
}
```

#### 投稿作品API (`src/api/postsApi.js`)
```javascript
// 投稿作品作成時に自動的にユーザーIDを追加
formData.append('authorId', getCurrentUserId())
```

### 3. **バックエンド処理**

#### メモ作成エンドポイント (`server/server.js`)
```javascript
app.post('/api/notes', (req, res) => {
  const { authorId } = req.body
  
  if (!authorId) {
    return res.status(400).json({ error: 'Author ID is required' })
  }
  
  const note = {
    // ...
    authorId, // ユーザーIDを保存
    // ...
  }
})
```

#### 投稿作品作成エンドポイント
```javascript
app.post('/api/posts', upload.single('file'), (req, res) => {
  const { authorId } = req.body
  
  if (!authorId) {
    return res.status(400).json({ error: 'Author ID is required' })
  }
  
  const post = {
    // ...
    authorId, // ユーザーIDを保存
    // ...
  }
})
```

### 4. **フロントエンド表示制御**

#### メモ・投稿作品の自他判定
```javascript
// onMounted内でデータ取得時
const backendNotes = fetchedNotes.map(note => ({
  ...note,
  isOwn: isCurrentUser(note.authorId), // 自他判定
  isExample: false
}))

const posts = await fetchPosts(props.name)
postsByCategory.value[props.name] = posts.map(post => ({
  ...post,
  isOwn: isCurrentUser(post.authorId) // 自他判定
}))
```

#### コンテキストメニュー表示制御
```vue
<!-- 自分のメモのみ編集・削除メニューを表示 -->
<template v-if="contextMenu.type === 'note' && contextMenu.isOwn">
  <button @click="editNote(...)">編集</button>
  <button @click="deleteNoteHandler(...)">削除</button>
</template>

<!-- 他人のメモは表示しない -->
<template v-else-if="contextMenu.type === 'note'">
  <!-- メニューなし -->
</template>
```

## データフロー

### メモ作成時
```
1. ユーザーが右クリック → メモ作成ダイアログ表示
2. ユーザーがメモを入力 → addNote() 実行
3. addNote() で getCurrentUserId() を取得
4. createNote() で authorId を含めてAPI送信
5. バックエンド: authorId を保存
6. フロントエンド: isOwn = true で表示
```

### メモ表示時
```
1. onMounted で fetchNotes() 実行
2. バックエンドから authorId 付きメモを取得
3. isCurrentUser(note.authorId) で自他判定
4. isOwn = true/false を設定
5. テンプレートで isOwn に基づいてメニュー表示制御
```

### 投稿作品作成時
```
1. ユーザーが投稿作品を作成
2. addPost() で getCurrentUserId() を取得
3. createPost() で authorId を含めてAPI送信
4. バックエンド: authorId を保存
5. フロントエンド: isOwn = true で表示
```

## ローカルストレージ構造

```javascript
// localStorage に保存される情報
{
  userId: "user_1764989390982_a1b2c3d4e",
  userName: "ユーザー名",
  deletedExampleNoteIds: "[\"example-bg-1\", \"example-bg-2\"]"
}
```

## セキュリティに関する注意

### 現在の実装
- **クライアント側のみで認証**: ブラウザのローカルストレージに基づいて自他判定
- **サーバー側での検証なし**: バックエンドは送信されたauthorIdをそのまま保存

### 本番環境での改善案

1. **セッション管理の実装**
   ```javascript
   // サーバー側でセッションを管理
   app.post('/api/notes', authenticateUser, (req, res) => {
     const userId = req.session.userId // セッションから取得
     // ...
   })
   ```

2. **JWT認証の導入**
   ```javascript
   // クライアント側でJWTトークンを送信
   const token = localStorage.getItem('authToken')
   fetch(url, {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

3. **バックエンド側での検証**
   ```javascript
   // 削除・更新時に所有者確認
   app.delete('/api/notes/:id', (req, res) => {
     const note = db.getNote(id)
     if (note.authorId !== req.session.userId) {
       return res.status(403).json({ error: 'Forbidden' })
     }
     // ...
   })
   ```

## テスト方法

### 1. 同じブラウザでの動作確認
```
1. ブラウザAでメモを作成
2. 同じブラウザでメモを表示
3. メモに編集・削除メニューが表示されることを確認
```

### 2. 異なるブラウザでの動作確認
```
1. ブラウザAでメモを作成
2. ブラウザB（別のユーザーID）でメモを表示
3. メモに編集・削除メニューが表示されないことを確認
```

### 3. ローカルストレージのリセット
```javascript
// コンソールで実行
localStorage.clear()
location.reload()
```

## トラブルシューティング

### 問題: 他人のメモが編集・削除できる
**原因**: バックエンド側での所有者確認がない
**解決**: バックエンド側で authorId の検証を追加

### 問題: ユーザーIDが変わる
**原因**: ローカルストレージがクリアされた
**解決**: ローカルストレージをクリアしないか、ユーザーIDをサーバー側で管理

### 問題: 複数デバイスで同じユーザーIDを使いたい
**原因**: 現在の実装はブラウザごとに異なるIDを生成
**解決**: ログイン機能を実装してサーバー側でユーザーを管理

## 今後の改善

1. **ユーザー登録・ログイン機能**
   - ユーザー名とパスワードでログイン
   - 複数デバイスでの同期

2. **ユーザープロフィール**
   - ユーザーアイコン
   - ユーザー情報表示

3. **権限管理**
   - 管理者権限
   - メモ・投稿作品の公開/非公開設定

4. **監査ログ**
   - メモ・投稿作品の作成・編集・削除履歴
   - ユーザーアクティビティの記録
