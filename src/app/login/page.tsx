import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-col justify-center bg-gradient-to-b from-green-50 to-white px-4 py-6 pt-safe pb-safe sm:py-12">
      <div className="mx-auto w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-800 sm:text-4xl">
            MGreen
          </h1>
          <p className="mt-2 text-base text-green-600">わが家の植物ノート</p>
        </div>

        {params.error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {decodeURIComponent(params.error)}
          </p>
        )}

        {params.message && (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm text-green-700">
            {params.message}
          </p>
        )}

        <div className="card-form space-y-6">
          <div>
            <h2 className="section-title">ログイン</h2>
            <form action={signIn} className="mt-4 space-y-5">
              <div>
                <label htmlFor="signin-email" className="field-label">
                  メールアドレス
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="field-label">
                  パスワード
                </label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="field-input"
                />
              </div>
              <button type="submit" className="btn-primary">
                ログイン
              </button>
            </form>
          </div>

          <hr className="border-green-100" />

          <div>
            <h2 className="section-title">新規登録（家族アカウント）</h2>
            <p className="mt-1 text-sm text-gray-500">
              お父さん・お母さん用のアカウントを作成します
            </p>
            <form action={signUp} className="mt-4 space-y-5">
              <div>
                <label htmlFor="signup-email" className="field-label">
                  メールアドレス
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="field-label">
                  パスワード（6文字以上）
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="field-input"
                />
              </div>
              <button type="submit" className="btn-secondary">
                アカウントを作成
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
