# SubPal 引き継ぎメモ（v1.9.0 / 2026-11-13）

## 概要
- サブスク管理＋PayPay使用額の集計をするPWA。マスコットはペンギンの「パル」
- リポジトリ：ZenithExtremers/subpal（main ブランチ）
- 公開URL：https://zenithextremers.github.io/subpal/ （GitHub Pages、main / root）
- ビルドなし。素の HTML / CSS / JS のみ。データはすべて端末の localStorage（キー `subpal.v1`）
- 利用者は Android（Pixel系）。ホーム画面に追加して使っている

## ファイル
| ファイル | 中身 |
|---|---|
| index.html | 骨組み（5タブ：ホーム / 一覧 / PayPay / 集計 / 設定、FAB、ボトムシート、トースト） |
| app.js | 全ロジック（描画・状態・通知・取り込み） |
| style.css | 見た目。ライト/ダークは `:root[data-theme]` で切替 |
| sw.js | Service Worker。ネット優先＋キャッシュ、バックグラウンド通知（periodicsync）、通知タップ |
| manifest.webmanifest | PWA設定。ショートカット「使った額を入力」(`?spend=1`)・「サブスクを追加」(`?add=1`) |
| icons/ | アイコン（icon.svg / maskable.svg が元。PNGは rsvg-convert で生成） |

**更新時のルール**：app.js 等を変えたら `sw.js` の `CACHE`（今は `subpal-shell-v12`）の数字を上げる。上げないとスマホに反映されにくい。`app.js` の `VERSION` も上げる（今は 1.9.0）。

## 状態（state）の形
```js
{
  subs: [{ id, name, price, cycle:'month'|'year'|'week', interval, nextDate:'YYYY-MM-DD', anchorDay,
           cat, color, trialEnd, notifyDays /* -1=通知しない */, url, memo,
           status:'active'|'paused'|'cancelled', createdAt, cancelledAt }],
  settings: { theme:'system'|'light'|'dark', notify:bool, defaultNotify:number, report:bool },
  notified: { [key]: timestamp },   // 送った通知の記録（60日で掃除）
  pay: { payments: [{ id, key, date, amount, shop, t, src:'manual'|undefined }], budget: number },
  report: { key, title, body } | null  // SW用の先月レポート
}
```
- `pay.payments` の `shop` は店名（空なら「店名なし」と表示）。v1.8 以前の記録には `cat`（種類）が残っているが、今は使っていない
- 古いデータに `pay.records`（残高・チャージ）が残っていることがあるが、今は使っていない（無視してよい）
- SW は localStorage を読めないので、`save()` のたびに Cache Storage（`subpal-data` の `/__subpal_data.json`）へ写している

## 主な機能
- **サブスク**：プリセット27件、月/年/週＋N回ごと、支払日の自動繰り上げ（月末日対応の anchorDay）、無料期間、一時停止/解約、1件ごとの通知オフ
- **通知**：支払い前・無料期間終了前・PayPay予算80%/100%・月初の先月レポート。アプリ起動時＋periodicsync で判定。`.ics` 書き出しあり
- **PayPayタブ**：今月/先月/月平均、月予算（残り・1日あたり）、月別グラフ、今月よく使ったお店（店名別・上位5店＋ほか）、今週/先週・曜日別（直近8週）、使った日カレンダー、記録一覧（タップで編集・削除）
- **ホーム**：パルの吹き出し、毎月の支払い、先月のふりかえり（1〜7日のみ）、今月の支出まとめ（サブスク＋PayPay）、30日以内の予定
- **集計**：月/年/1日あたり、カテゴリ別ドーナツ、12か月予定、高い順
- **設定**：通知、既定の通知タイミング、先月レポート、.ics、テーマ、JSONバックアップ/復元、全削除
- 金額の短縮表示は `yenShort()`（例：1.9万円 / 6,200円）。「k」表記は使わない

## PayPay自動取り込み（MacroDroid 連携）
PayPayにはつながない。Android の MacroDroid が PayPay の支払い通知から金額を拾い、SubPal に URL で渡す。

**マクロ1「PayPay金額を拾う」**
- トリガー：通知が表示された時／アプリ PayPay／テキスト「取引が完了」を含む／常駐通知は除外／複数トリガーまとめ：オフ
- 実際の支払い通知（2026-11-18確認）：`取引が完了しました。` `金額：192円` `取引番号：0511…` `店舗名：カスミ`（「支払」という言葉は入らない）
- アクション①：文字列処理 → 文字列の抽出：対象 `{notification}`、正規表現 `([0-9,]+)円`、グループ1 → ローカル変数 `amt`
- アクション②：グローバル変数 `pp_log` を設定：`{v=pp_log}{not_timestamp}_{lv=amt}_{notification};`

**マクロ2「SubPalに送る」**
- トリガー：ショートカットで起動（ホーム画面のボタン）／アプリを起動時：SubPal（開くだけで自動取り込み）
- 条件：変数 `pp_log` が `;` を含む（空のときは動かない。これがないと起動のたびにループする）
- アクション①：Webサイトを開く `https://zenithextremers.github.io/subpal/#pp={v=pp_log}`（URLエンコード：オン、HTTP GET：オフ）
- アクション②：`pp_log` を空にする

**SubPal側（`importPayments()` / `takeHash()`）**
- `#pp=` を読み（`hashchange` も対応）、`;` 区切りで1件ずつ処理。旧形式の `?pp=` も読める
- 1件の形式：`タイムスタンプ_金額_通知テキスト`（通知テキストなし・金額だけの旧形式も可）
- タイムスタンプは `parseStamp()` で何の形式でも日付にする（エポック秒/ミリ秒、`YYYY/MM/DD hh:mm:ss`、`YYYY.M.D` 等）
- 通知テキストから `parseShop()` で「店舗名：」の後ろだけを取り出して `shop` に保存する。通知テキストそのものは**保存しない**
- 重複防止キーは `タイムスタンプ_金額`
- `#` を使うのは、通知テキスト（店名）をサーバーへ送らないため。`?` に戻さないこと

## 未確認・やり残し
- **本物のPayPay支払い通知**：文言を確認済み（上記）。SubPal側はこの文言で金額192円・種類「食費」（カスミ）と取り込めることを確認。マクロ1のトリガーを「取引が完了」に変えたあと、実機での取り込みも成功（2026-11-19）
  - 拾えない場合は、マクロ1のトリガー文字列か正規表現を通知の文言に合わせる
- 通知のバックグラウンド配信（periodicsync）は端末任せで、実機での届き方は未確認
- ホーム画面ショートカット（アイコン長押し）は、WebAPKの更新待ちで反映まで数日かかることがある

## ユーザーの好み（作業の進め方）
- 返答は日本語・簡潔に
- 確認や質問は選択式で出す
- リンクはタップで飛べる形にする
- アプリは GitHub Pages の PWA で作る
- 修正が終わったら、確認せずに main へ直接入れて公開してよい（作業ブランチにも push する）
