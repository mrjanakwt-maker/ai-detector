export default function Refund() {
  return (
    <div
      className="min-h-screen bg-[#08080d] text-white"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">DetectAI</span>
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 31, 2026</p>

        <div className="space-y-8 text-zinc-400 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Our Commitment</h2>
            <p>
              We want you to be completely satisfied with DetectAI. If our service does not meet your expectations, we offer a straightforward refund process.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">7-Day Money-Back Guarantee</h2>
            <p>
              All new premium subscriptions come with a 7-day money-back guarantee. If you are not satisfied with DetectAI Pro within the first 7 days of your subscription, you can request a full refund — no questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">How to Request a Refund</h2>
            <p>
              To request a refund, simply email us at support@detectai.com with your account email address and the reason for your refund request (optional but appreciated). We will process your refund within 5-10 business days. The refund will be issued to the original payment method used for the subscription.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">After the 7-Day Period</h2>
            <p>
              After the initial 7-day period, refunds are handled on a case-by-case basis. We may offer a prorated refund for the unused portion of your current billing cycle if there are extenuating circumstances. You can cancel your subscription at any time to prevent future charges. Cancellation takes effect at the end of your current billing period, and you will continue to have access to premium features until then.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Cancellation</h2>
            <p>
              You can cancel your premium subscription at any time from your account settings or by contacting us at support@detectai.com. When you cancel, you will retain access to premium features for the remainder of your current billing period. After your billing period ends, your account will revert to the free plan with 5 daily scans. No further charges will be made after cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Free Plan</h2>
            <p>
              The free plan does not require any payment and therefore is not subject to refunds. Free plan users receive 5 scans per day, which reset daily at midnight.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">Contact Us</h2>
            <p>
              If you have any questions about our refund policy or need assistance with a refund, please reach out to us at support@detectai.com. We typically respond within 24 hours.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-600">&copy; 2026 DetectAI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="/terms" className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors">Terms</a>
            <a href="/refund" className="text-xs text-cyan-400">Refund</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
