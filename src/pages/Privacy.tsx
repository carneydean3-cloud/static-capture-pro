const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-slate-500 mb-8">Last Updated: April 1, 2026</p>

        <div className="space-y-8">

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              1. Who We Are
            </h2>
            <p className="text-slate-700">
              ConversionDoc Ltd operates conversiondoc.co.uk. We are committed to 
              protecting your personal data in accordance with UK GDPR and the 
              Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              2. Data We Collect
            </h2>
            <p className="text-slate-700 mb-3">We collect the following data:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                <strong className="text-slate-900">Account Data:</strong> Email address when you sign up
              </li>
              <li>
                <strong className="text-slate-900">Usage Data:</strong> URLs you submit for auditing
              </li>
              <li>
                <strong className="text-slate-900">Payment Data:</strong> Processed securely by Stripe. 
                We do not store card details
              </li>
              <li>
                <strong className="text-slate-900">Technical Data:</strong> IP address, browser type, 
                pages visited
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>To provide and improve the audit service</li>
              <li>To process payments and manage your subscription</li>
              <li>To send service-related emails (receipts, reports)</li>
              <li>To analyse usage and improve our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              4. Who We Share Data With
            </h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                <strong className="text-slate-900">Stripe:</strong> Payment processing
              </li>
              <li>
                <strong className="text-slate-900">Supabase:</strong> Secure data storage
              </li>
              <li>
                <strong className="text-slate-900">Google Analytics:</strong> Anonymous usage statistics
              </li>
            </ul>
            <p className="text-slate-700 mt-3">
              We never sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              5. Your Rights (UK GDPR)
            </h2>
            <p className="text-slate-700 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
            <p className="text-slate-700 mt-3">
              To exercise any of these rights, email: support@conversiondoc.co.uk
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              6. Cookies
            </h2>
            <p className="text-slate-700">
              We use essential cookies to keep you logged in and analytics cookies 
              to understand how visitors use our site. You can disable cookies in 
              your browser settings, though this may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              7. Data Retention
            </h2>
            <p className="text-slate-700">
              We retain your data for as long as your account is active. If you 
              delete your account, we will remove your personal data within 30 days, 
              except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
              8. Contact Us
            </h2>
            <p className="text-slate-700">
              For privacy-related questions:<br />
              Email: support@conversiondoc.co.uk<br />
              Website: https://conversiondoc.co.uk
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
