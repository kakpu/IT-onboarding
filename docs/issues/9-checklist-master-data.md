# Issue #9: チェックリスト項目マスタデータ投入

## 背景 / 目的

Day1-3の全チェックリスト項目データを作成し、Supabaseに投入する。これにより、実際の運用に近いデータでアプリケーションの動作確認ができる。

- **依存**: #8
- **ラベル**: backend, database, content

## スコープ / 作業項目

1. Day1項目データ作成（4項目）
2. Day2項目データ作成（6項目）
3. Day3項目データ作成（5項目）
4. `supabase/seed.sql`に全項目INSERT文追加
5. Supabase管理画面でデータ確認

## ゴール / 完了条件（Acceptance Criteria）

- [ ] Day1項目データ作成（4項目: Windowsログイン, M365, Teams, iPhone）
- [ ] Day2項目データ作成（6項目: ポータル, プリンタ, VPN等）
- [ ] Day3項目データ作成（5項目: よくあるトラブル対応）
- [ ] `supabase/seed.sql`に全項目INSERT文追加
- [ ] Supabase管理画面で15項目データ確認
- [ ] 各項目に`summary`, `steps` (JSONB), `notes`, `order_index`設定完了

## テスト観点

- **データ件数確認**: `checklist_items`テーブルに15件のレコードが存在すること
- **Day別件数確認**: Day1: 4件、Day2: 6件、Day3: 5件
- **JSONB形式確認**: `steps`カラムがJSONB形式で正しく保存されていること
- **表示順確認**: `order_index`順でソートされること

### 検証方法

```bash
# Supabase CLIでデータ投入
pnpm exec supabase db reset

# Supabase管理画面でデータ確認
# http://localhost:54323/project/default/editor

# 件数確認SQL
SELECT day, COUNT(*) FROM checklist_items GROUP BY day ORDER BY day;
```

## データ例（docs/01_requirements.md, docs/03_database.md参照）

### Day1項目（4項目）

1. **Windowsログイン**
   - category: `login`
   - summary: `Windows PCに初回ログインする`
   - steps: `["1. PCの電源を入れる", "2. Ctrl + Alt + Del を押す", "3. 配布されたユーザーID・パスワードを入力", "4. 言語設定を日本語に変更"]`
   - notes: `パスワードは初回ログイン後に変更してください`

2. **Microsoft 365 初期設定**
   - category: `m365`
   - summary: `M365アカウントにログインし、基本設定を完了する`
   - steps: `["1. ブラウザでoffice.comにアクセス", "2. 配布されたメールアドレスでログイン", "3. 多要素認証（MFA）を設定", "4. OneDriveの同期設定"]`
   - notes: `MFAは必ず設定してください（セキュリティポリシー）`

3. **Microsoft Teams セットアップ**
   - category: `teams`
   - summary: `Teamsアプリをインストールして初期設定する`
   - steps: `["1. Teamsアプリをダウンロード", "2. M365アカウントでサインイン", "3. 通知設定を確認", "4. プロフィール写真を設定"]`
   - notes: `通知設定は後から変更できます`

4. **iPhone初期設定**
   - category: `iphone`
   - summary: `会社支給のiPhoneを初期設定する`
   - steps: `["1. iPhoneの電源を入れる", "2. Wi-Fi接続設定", "3. Apple IDでサインイン", "4. Face ID / Touch ID設定", "5. 会社のメールアカウント追加"]`
   - notes: `Apple IDは個人のものを使用してください`

### Day2項目（6項目）

1. **ポータルサイトアクセス**
   - category: `portal`
   - summary: `社内ポータルサイトにアクセスし、ブックマーク登録する`

2. **プリンタ設定**
   - category: `printer`
   - summary: `ネットワークプリンタを追加し、テスト印刷する`

3. **VPN設定**
   - category: `vpn`
   - summary: `VPNクライアントをインストールし、接続確認する`

4. **セキュリティソフト確認**
   - category: `security`
   - summary: `ウイルス対策ソフトが正常に動作しているか確認する`

5. **ファイルサーバーアクセス**
   - category: `file_server`
   - summary: `共有フォルダにアクセスし、マイドキュメントに接続する`

6. **Wi-Fi設定（iPhone）**
   - category: `wifi`
   - summary: `iPhoneで社内Wi-Fiに接続する`

### Day3項目（5項目）

1. **パスワード忘れ対応**
   - category: `troubleshoot`
   - summary: `パスワードを忘れた場合の再設定手順`

2. **ログインできない場合**
   - category: `troubleshoot`
   - summary: `Windowsにログインできない場合の対処法`

3. **メールが受信できない**
   - category: `troubleshoot`
   - summary: `Outlookでメールが受信できない場合の確認手順`

4. **VPN接続エラー**
   - category: `troubleshoot`
   - summary: `VPNに接続できない場合の対処法`

5. **プリンタ印刷エラー**
   - category: `troubleshoot`
   - summary: `プリンタで印刷できない場合の確認手順`

## supabase/seed.sql例

```sql
-- Day1項目
INSERT INTO checklist_items (day, category, title, summary, steps, notes, order_index) VALUES
(1, 'login', 'Windowsログイン', 'Windows PCに初回ログインする',
 '["1. PCの電源を入れる", "2. Ctrl + Alt + Del を押す", "3. 配布されたユーザーID・パスワードを入力", "4. 言語設定を日本語に変更"]'::jsonb,
 'パスワードは初回ログイン後に変更してください', 1),

(1, 'm365', 'Microsoft 365 初期設定', 'M365アカウントにログインし、基本設定を完了する',
 '["1. ブラウザでoffice.comにアクセス", "2. 配布されたメールアドレスでログイン", "3. 多要素認証（MFA）を設定", "4. OneDriveの同期設定"]'::jsonb,
 'MFAは必ず設定してください（セキュリティポリシー）', 2);

-- Day2, Day3項目も同様に追加
```

## 要確認事項

- Day2, Day3の各項目の詳細な手順（steps）は、実際の運用環境に合わせて調整が必要
- カテゴリ名（category）の命名規則は統一されているか？
