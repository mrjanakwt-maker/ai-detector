export default function Privacy() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-10">Last updated: March 31, 2026</p>

        <div className="space-y-8 text-zinc-400 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">1. Information We Collect</h2>
            <p>
              DetectAI is designed with privacy in mind. When you use our service, the text you submit for analysis is processed in real-time and is not stored on our servers after the analysis is complete. We do not save, log, or retain any text content submitted for detection.
            </p>
            <p className="mt-3">
              We may collect basic usage analytics such as page views, feature usage counts, and general geographic region to improve our service. This data is aggregated and cannot be used to identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">2. How We Use Your Information</h2>
            <p>
              Text submitted for analysis is sent to our detection engines (including third-party AI models) solely for the purpose of providing you with detection results. This text is processed in real-time and discarded immediately after analysis. We use aggregated, anonymized usage data to improve our detection algorithms, monitor service performance, and enhance user experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">3. Third-Party Services</h2>
            <p>
              DetectAI uses third-party AI services to power its detection engines, including Anthropic (Claude) and HuggingFace. Text submitted for analysis may be processed by these services in accordance with their respective privacy policies. We recommend reviewing the privacy policies of Anthropic (anthropic.com) and HuggingFace (huggingface.co) for more information on how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">4. Data Storage and Security</h2>
            <p>
              We do not store the text you submit for analysis. Usage limits are tracked locally in your browser using localStorage and are not transmitted to our servers. If you create an account for premium features, your account information (email, subscription status) is stored securely and encrypted. We use industry-standard security measures to protect any data we do collect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">5. Cookies</h2>
            <p>
              DetectAI uses minimal cookies and localStorage for essential functionality such as tracking daily free usage limits. We do not use advertising cookies or tracking pixels. No personal data is stored in cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">6. Your Rights</h2>
            <p>
              Since we do not store your submitted text or personal data (unless you create an account), there is generally no personal data to request, modify, or delete. If you have a premium account, you may request deletion of your account data by contacting us at support@detectai.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">7. Children's Privacy</h2>
            <p>
              DetectAI is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of DetectAI after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mb-3">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at support@detectai.com.
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-600">&copy; 2026 DetectAI. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-cyan-400">Privacy</a>
            <a href="/terms" className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors">Terms</a>
            <a href="/refund" className="text-xs text-zinc-500 hover:text-cyan-400 transition-colors">Refund</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
