import { motion } from 'motion/react';
import { Gavel, AlertCircle, CheckCircle, Scale, Clock, Terminal } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-white uppercase whitespace-nowrap">
            <span className="text-white">Terms of</span>
            <span className="text-brand-blue ml-3">Service</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">Effective Date: April 23, 2026</p>
          <div className="w-12 h-1 bg-brand-blue mx-auto rounded-full mt-6" />
        </div>

        <div className="glass-card p-8 md:p-12 space-y-8 leading-relaxed">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-blue mb-2">
              <Gavel className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-serif text-white">Agreement to Terms</h2>
            </div>
            <p className="text-gray-300">
              By accessing or using Prince Star, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services. These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand-blue">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-white">Responsible Use</h3>
              </div>
              <p className="text-sm text-gray-400">
                AI outputs should be verified. Users are responsible for how they apply the information provided by the Assistant.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-brand-blue">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-white">Acceptable Conduct</h3>
              </div>
              <p className="text-sm text-gray-400">
                Users must not use the platform for any illegal, harmful, or unethical purposes, including generation of malicious content.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-blue mb-2">
              <Terminal className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-serif text-white">Intellectual Property</h2>
            </div>
            <p className="text-gray-300">
              The Service and its original content, features, and functionality are and will remain the exclusive property of Prince Star and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent.
            </p>
            <p className="text-sm text-gray-400 italic">
              User-generated content remains your property, but you grant us a license to process it to provide the service.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-blue mb-2">
              <Scale className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-serif text-white">Limitation of Liability</h2>
            </div>
            <p className="text-gray-300">
              In no event shall Prince Star, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or use.
            </p>
          </section>

          <section className="space-y-4 border-t border-white/5 pt-8">
            <div className="flex items-center gap-3 text-brand-blue mb-2">
              <Clock className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-serif text-white">Changes to Terms</h2>
            </div>
            <p className="text-gray-300">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
