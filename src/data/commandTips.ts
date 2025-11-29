/**
 * コマンド解説・応用パターン
 * 正解時に表示するTips
 */

export interface CommandTip {
  /** 実務での使用シーン */
  scene: string;
  /** 応用パターン・関連コマンド */
  tips: string[];
}

/** コマンドIDごとの解説 */
export const COMMAND_TIPS: Record<string, CommandTip> = {
  // ========================================
  // Linux基本コマンド
  // ========================================
  'ls': {
    scene: 'ディレクトリの中身確認は作業の基本。デプロイ前の確認やログファイル探しに毎日使う。',
    tips: [
      'ls -lh → サイズを人間が読みやすい形式で表示',
      'ls -t → 更新日時順でソート（最新が先頭）',
      'ls *.log → ワイルドカードで絞り込み',
    ],
  },
  'cd': {
    scene: 'ディレクトリ移動はターミナル操作の基本中の基本。',
    tips: [
      'cd - → 直前のディレクトリに戻る',
      'cd ~ → ホームディレクトリに一発移動',
      'cd ../.. → 2階層上に移動',
    ],
  },
  'pwd': {
    scene: 'スクリプト内で現在位置を確認したり、パスをコピーする時に便利。',
    tips: [
      '$(pwd) → コマンド内で現在パスを展開',
      'pwd -P → シンボリックリンクを解決した実パス',
    ],
  },
  'mkdir': {
    scene: 'プロジェクト初期化やログディレクトリ作成など頻出。',
    tips: [
      'mkdir -p a/b/c → 深い階層を一気に作成',
      'mkdir {src,dist,test} → 複数ディレクトリを同時作成',
    ],
  },
  'touch': {
    scene: '空ファイル作成やタイムスタンプ更新。設定ファイルの雛形作成に。',
    tips: [
      'touch file{1..5}.txt → 連番ファイルを一括作成',
      'ファイルが存在すれば更新日時だけ変更される',
    ],
  },
  'rm': {
    scene: '不要ファイル・ディレクトリの削除。CI/CDのクリーンアップでも使用。',
    tips: [
      'rm -i → 削除前に確認プロンプト（安全）',
      'rm -rf は超強力。本番環境では細心の注意を！',
    ],
  },
  'cp': {
    scene: 'バックアップ作成や設定ファイルの複製に毎日使う。',
    tips: [
      'cp -r → ディレクトリごとコピー',
      'cp file{,.bak} → file を file.bak としてコピー',
    ],
  },
  'mv': {
    scene: 'ファイル移動とリネームを兼ねる。整理整頓の必須コマンド。',
    tips: [
      'mv *.log logs/ → 複数ファイルを一括移動',
      'mv old.txt new.txt → リネームとして使用',
    ],
  },
  'cat': {
    scene: '設定ファイルの確認やログの中身をサッと見たい時に。',
    tips: [
      'cat -n → 行番号付きで表示',
      'cat a.txt b.txt > merged.txt → ファイル結合',
    ],
  },
  'grep': {
    scene: 'ログからエラー検索、コード内の文字列検索など超頻出。',
    tips: [
      'grep -r "TODO" . → 再帰的に検索',
      'grep -i → 大文字小文字を区別しない',
      'grep -C 3 → 前後3行も表示',
    ],
  },

  // ========================================
  // Git コマンド
  // ========================================
  'git.status': {
    scene: 'コミット前の状態確認。変更漏れがないか必ずチェック。',
    tips: [
      'git status -s → 短縮形式で表示',
      '?? は未追跡、M は変更あり、A はステージ済み',
    ],
  },
  'git.add': {
    scene: 'コミット対象を選択。部分的なコミットで履歴を綺麗に。',
    tips: [
      'git add -p → 変更を対話的に選択してステージ',
      'git add . → 全ての変更をステージ（注意して使用）',
    ],
  },
  'git.commit': {
    scene: '変更を履歴に記録。メッセージは未来の自分への手紙。',
    tips: [
      'git commit --amend → 直前のコミットを修正',
      'コミットメッセージは「何を」「なぜ」を簡潔に',
    ],
  },
  'git.branch': {
    scene: 'ブランチ一覧確認。複数機能を並行開発する時の基本。',
    tips: [
      'git branch -d <name> → マージ済みブランチを削除',
      'git branch -a → リモートブランチも含めて表示',
    ],
  },
  'git.checkout': {
    scene: 'ブランチ切り替えの定番。feature開発の起点。',
    tips: [
      'git switch → checkout より新しいブランチ切替コマンド',
      'git checkout -- file → ファイルの変更を取り消し',
    ],
  },
  'git.log': {
    scene: 'コミット履歴の調査。バグの原因特定や変更追跡に。',
    tips: [
      'git log --oneline → 1行表示でコンパクトに',
      'git log -p → 差分も一緒に表示',
      'git log --graph → ブランチの分岐を視覚化',
    ],
  },
  'git.diff': {
    scene: 'コミット前の差分確認。レビュー前に自分でチェック。',
    tips: [
      'git diff --staged → ステージ済みの差分を表示',
      'git diff HEAD~3 → 3コミット前との差分',
    ],
  },
  'git.stash': {
    scene: '作業を一時退避。急なブランチ切り替えに対応。',
    tips: [
      'git stash save "WIP: 機能A" → 名前付きで保存',
      'git stash apply → pop と違い、スタッシュを残したまま復元',
    ],
  },

  // ========================================
  // Docker コマンド
  // ========================================
  'docker.ps': {
    scene: '実行中コンテナの確認。トラブルシュート時の第一歩。',
    tips: [
      'docker ps -a → 停止中も含めて全コンテナ表示',
      'docker ps -q → ID だけ表示（スクリプト向け）',
    ],
  },
  'docker.run': {
    scene: 'イメージからコンテナを起動。開発環境の構築に。',
    tips: [
      '-d → バックグラウンド実行',
      '-p 8080:80 → ポートマッピング',
      '-v $(pwd):/app → ボリュームマウント',
    ],
  },
  'docker.images': {
    scene: 'ローカルのイメージ一覧。ディスク容量管理にも。',
    tips: [
      'docker image prune → 不要イメージを一括削除',
      'docker images -q → ID だけ表示',
    ],
  },
  'docker.pull': {
    scene: 'Docker Hub からイメージ取得。環境構築の最初のステップ。',
    tips: [
      'タグを指定: docker pull nginx:1.25',
      '公式イメージは library/ が省略されている',
    ],
  },
  'docker.stop': {
    scene: 'コンテナを停止。リソース解放やメンテナンス時に。',
    tips: [
      'docker stop $(docker ps -q) → 全コンテナを一括停止',
      '-t 0 → 即座に停止（SIGKILL）',
    ],
  },
  'docker.rm': {
    scene: '停止済みコンテナを削除。ディスク容量の節約に。',
    tips: [
      'docker container prune → 停止中コンテナを一括削除',
      'docker rm -f → 実行中でも強制削除（注意）',
    ],
  },
  'docker.logs': {
    scene: 'コンテナのログ確認。エラー調査の基本。',
    tips: [
      'docker logs -f → リアルタイムでログを追跡',
      'docker logs --tail 100 → 最新100行だけ表示',
    ],
  },
  'docker.exec': {
    scene: '実行中コンテナ内でコマンド実行。デバッグに必須。',
    tips: [
      '-it でインタラクティブモード（シェル操作）',
      'docker exec container cat /etc/hosts → ワンライナー実行',
    ],
  },

  // ========================================
  // Python コマンド
  // ========================================
  'python.venv': {
    scene: 'プロジェクトごとに独立した環境を作成。依存関係の衝突を防ぐ。',
    tips: [
      'venv は標準ライブラリ。追加インストール不要',
      '.gitignore に venv/ を追加しておこう',
    ],
  },
  'source.activate': {
    scene: '仮想環境を有効化。パッケージがプロジェクト専用になる。',
    tips: [
      'Windows: venv\\Scripts\\activate',
      'プロンプトに (venv) が表示されれば成功',
    ],
  },
  'deactivate': {
    scene: '仮想環境を無効化。システムのPythonに戻る。',
    tips: [
      '別プロジェクトに移る前に実行',
      '無効化を忘れても別の venv を activate すれば上書きされる',
    ],
  },
  'pip.list': {
    scene: 'インストール済みパッケージの確認。環境の棚卸しに。',
    tips: [
      'pip list --outdated → 更新可能なパッケージを表示',
      'pip show <pkg> → 詳細情報を表示',
    ],
  },
  'pip.install': {
    scene: 'パッケージのインストール。開発の第一歩。',
    tips: [
      'pip install -r requirements.txt → 一括インストール',
      'pip install pkg==1.0.0 → バージョン指定',
    ],
  },
  'pip.freeze': {
    scene: '依存関係の出力。requirements.txt 作成に必須。',
    tips: [
      'pip freeze > requirements.txt → ファイルに保存',
      '開発用と本番用で分けることもある',
    ],
  },

  // ========================================
  // Network コマンド
  // ========================================
  'ping': {
    scene: 'ネットワーク疎通確認の基本。サーバーが生きてるか最初に確認。',
    tips: [
      'ping -c 3 → 3回だけ送信して終了',
      'レスポンスが返ればネットワーク的には到達可能',
    ],
  },
  'curl': {
    scene: 'HTTPリクエスト送信。API 動作確認やデバッグに超便利。',
    tips: [
      'curl -X POST -d "data" → POSTリクエスト',
      'curl -H "Authorization: Bearer xxx" → ヘッダー付与',
      'curl -o file.zip URL → ファイル保存',
    ],
  },
  'wget': {
    scene: 'ファイルダウンロードの定番。スクリプトでの自動取得に。',
    tips: [
      'wget -q → 進捗表示なし（スクリプト向け）',
      'wget -r → 再帰的にダウンロード（サイト丸ごと）',
    ],
  },
  'scp': {
    scene: 'サーバー間のファイル転送。デプロイやログ回収に。',
    tips: [
      'scp -r → ディレクトリごと転送',
      'scp -P 2222 → ポート指定',
      'rsync の方が高機能（差分転送可能）',
    ],
  },
  'ssh': {
    scene: 'リモートサーバーへの接続。インフラ作業の入り口。',
    tips: [
      'ssh -i key.pem → 秘密鍵を指定',
      '~/.ssh/config で接続設定を管理すると楽',
    ],
  },
};

/**
 * コマンドIDから解説を取得
 */
export function getCommandTip(commandId: string): CommandTip | null {
  return COMMAND_TIPS[commandId] || null;
}
