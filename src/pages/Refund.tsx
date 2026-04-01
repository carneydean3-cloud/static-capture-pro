const Refund = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        Refund Policy
      </h1>
      <p className="text-slate-600 mb-8">Last Updated: April 1, 2026</p>

      <div className="prose prose-lg prose-slate max-w-none space-y-8">

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            1. Our Guarantee
          </h2>
          <p className="text-slate-600">
            We stand behind the quality of our audits. If you are not satisfied 
            with your Full Diagnosis purchase, you may request a full refund 
            within 5 days of purchase, no questions asked.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            2. What Is Eligible for a Refund
          </h2>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li>
              <strong>Full Diagnosis (£149):</strong> Eligible for full refund 
              within 5 days of purchase
            </li>
            <li>
              <strong>Starter Pro (£99/month):</strong> Eligible for refund 
              within 5 days of initial purchase only. Renewal charges are 
              non-refundable
            </li>
            <li>
              <strong>Agency Pro (£199/month):</strong> Eligible for refund 
              within 5 days of initial purchase only. Renewal charges are 
              non-refundable
            </li>
            <li>
              <strong>Free Audit:</strong> No charge, no refund applicable
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            3. What Is Not Eligible for a Refund
          </h2>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li>Requests made more than 5 days after purchase</li>
            <li>Monthly subscription renewals</li>
            <li>Accounts found to be in violation of our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            4. How to Request a Refund
          </h2>
          <p className="text-slate-600 mb-3">
            To request a refund, email us at support@conversiondoc.co.uk with:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2">
            <li>Your name</li>
            <li>Email address used for purchase</li>
            <li>Date of purchase</li>
            <li>Reason for refund (optional but helpful)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            5. Processing Time
          </h2>
          <p className="text-slate-600">
            Approved refunds are processed within 5-10 business days. The refund 
            will be returned to your original payment method via Stripe.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            6. Cancelling Your Subscription
          </h2>
          <p className="text-slate-600">
            You can cancel your subscription at any time from your account 
            settings. Cancellation stops future charges but does not automatically 
            trigger a refund for the current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-3">
            7. Contact Us
          </h2>
          <p className="text-slate-600">
            For refund requests or questions:<br />
            Email: support@conversiondoc.co.uk<br />
            Website: https://conversiondoc.co.uk
          </p>
        </section>

      </div>
    </div>
  );
};

export default Refund;
