import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Star } from "lucide-react";
import { useState } from "react";
import { BRAND } from "@/shared/config/brand";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex h-screen w-full bg-background font-sans text-foreground">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-foreground p-12 lg:flex">
        <div>
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-background"
          >
            {BRAND.name}
          </Link>
        </div>

        <div className="max-w-md">
          <h1 className="mb-4 text-5xl font-bold leading-[1.1] tracking-tight text-background xl:text-6xl">
            Lấy lại quyền truy cập tài khoản
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu để
            bạn có thể tiếp tục sử dụng {BRAND.name}.
          </p>
        </div>

        <div className="max-w-sm">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <Star key={item} className="h-4 w-4 fill-current text-primary" />
            ))}
          </div>
          <p className="text-sm italic font-medium leading-relaxed text-background/90">
            "The password reset was instant and I got back to applying in under
            a minute."
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Anna Vo - Growth Marketer
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full border border-border/40" />
      </section>

      <section className="flex w-full flex-col items-center justify-center bg-card px-6 py-12 lg:w-1/2 lg:px-24">
        <div className="w-full max-w-[400px]">
          <header className="mb-10 text-center lg:text-left">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
              Quên mật khẩu?
            </h2>
            <p className="text-sm text-muted-foreground">
              Nhập email tài khoản của bạn, chúng tôi sẽ gửi liên kết đặt lại
              mật khẩu.
            </p>
          </header>

          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm transition-all placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-4 text-sm font-bold tracking-wide text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
              >
                Gửi liên kết đặt lại mật khẩu
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-border bg-muted p-4 text-sm text-foreground">
              Nếu tài khoản với email{" "}
              <span className="font-semibold">{email}</span> tồn tại, liên kết
              đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến của
              bạn.
            </div>
          )}

          <div className="mt-8 text-center lg:text-left">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
