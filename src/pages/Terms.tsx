const Terms = () => {
  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-8 md:p-10">

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-slate-400 mb-8">Last Updated: April 1, 2026</p>

          <div className="space-y-8">

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                1. Agreement to Terms
              </h2>
              <p className="text-slate-700">
                By accessing ConversionDoc ("Service"), operated by ConversionDoc Ltd,
                you agree to be bound by these Terms of Service. If you do not agree,
                do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                2. Description of Service
              </h2>
              <p className="text-slate-700 mb-3">ConversionDoc provides:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>
                  <strong className="text-slate-900">Free Audit:</strong> Landing page analysis
                  with conversion score and top 3 fixes
                </li>
                <li>
                  <strong className="text-slate-900">Full Diagnosis (£149 one-time):</strong> Complete
                  analysis, rewritten copy, visual mockup, and downloadable code
                </li>
                <li>
                  <strong className="text-slate-900">Starter Pro (£99/month):</strong> 20 full audits
                  per month with priority support
                </li>
                <li>
                  <strong className="text-slate-900">Agency Pro (£199/month):</strong> Unlimited audits
                  for agencies managing multiple clients
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                3. Payment Terms
              </h2>
              <p className="text-slate-700">
                All payments are processed securely through Stripe. Prices are in
                GBP and include VAT where applicable. Subscription fees are billed
                monthly and are non-refundable except as stated in our Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                4. Acceptable Use
              </h2>
              <p className="text-slate-700 mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Resell or redistribute audit reports without permission</li>
                <li>Attempt to reverse engineer the Service</li>
                <li>Submit URLs you do not own or have permission to audit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                5. Intellectual Property
              </h2>
              <p className="text-slate-700">
                All audit reports generated are for your personal or business use.
                ConversionDoc retains ownership of the underlying technology,
                methodology, and platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                6. Limitation of Liability
              </h2>
              <p className="text-slate-700">
                ConversionDoc provides recommendations based on AI analysis. We do
                not guarantee specific conversion rate improvements. Our liability
                is limited to the amount paid for the Service in the 30 days
                preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                7. Governing Law
              </h2>
              <p className="text-slate-700">
                These Terms are governed by the laws of England and Wales. Any
                disputes shall be subject to the exclusive jurisdiction of the
                courts of England and Wales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                8. Contact Information
              </h2>
              <p className="text-slate-700">
                For questions about these Terms:<br />
                Email: support@conversiondoc.co.uk<br />
                Website: https://conversiondoc.co.uk
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
