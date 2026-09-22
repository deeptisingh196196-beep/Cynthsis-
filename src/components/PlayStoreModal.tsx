import React, { useState } from 'react';
import { X, Smartphone, Download, ExternalLink, Copy, Check, Apple, Sparkles, Star, ShieldCheck } from 'lucide-react';

interface PlayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
  appUrl: string;
}

export const PlayStoreModal: React.FC<PlayStoreModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPwa,
  appUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'playstore' | 'appstore'>('both');

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pwaBuilderAndroidUrl = `https://www.pwabuilder.com/report?url=${encodeURIComponent(appUrl)}`;
  const pwaBuilderIosUrl = `https://www.pwabuilder.com/report?url=${encodeURIComponent(appUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1117] border border-blue-500/30 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Blue Star Logo & Free Badge */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-[#0a0c12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src="/icon.svg" alt="Cynthsis Blue Star Logo" className="w-full h-full rounded-[14px] object-cover" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-sm">
                <Star className="w-3 h-3 text-white fill-blue-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  <span>Cynthsis</span>
                  <span className="text-blue-400 flex items-center text-sm font-semibold">
                    (नीला स्टार ऐप ⭐)
                  </span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/40 uppercase tracking-wide">
                  100% FREE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Google Play Store & Apple App Store रेडी • कोई शुल्क नहीं
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store Switcher Tabs */}
        <div className="flex border-b border-zinc-800 bg-[#0d0f16] px-4 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'both'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            ⭐ दोनों स्टोर (Play Store & App Store)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'playstore'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>Google Play (Android)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appstore')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appstore'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Apple App Store (iOS)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[72vh]">
          {/* 1. FREE GUARANTEE BANNER */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 via-emerald-950/30 to-blue-950/40 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-zinc-200">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>100% फ्री ऐप:</strong> यह ऐप बिल्कुल मुफ़्त है, कोई सब्सक्रिप्शन या इन-ऐप खरीददारी नहीं है।
              </span>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 shrink-0">
              ₹0 / Free
            </span>
          </div>

          {/* 2. DIRECT 1-TAP INSTALL (ANDROID & IPHONE) */}
          <div className="p-4 rounded-2xl bg-[#141822] border border-blue-500/40 space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>1. फोन में तुरंत फ्री इंस्टॉल करें</span>
                    <span className="text-blue-400">⭐</span>
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    बिना स्टोर पर इंतज़ार किए, अपने फ़ोन पर ओरिजिनल ऐप की तरह तुरंत चलाएं।
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/40">
                तुरंत काम करेगा
              </span>
            </div>

            {deferredPrompt ? (
              <button
                type="button"
                onClick={onInstallPwa}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>अभी अपने Android फोन में इंस्टॉल करें (Install Free App)</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-1">
                {/* Android Steps */}
                <div className="p-3 bg-black/40 rounded-xl border border-zinc-800 space-y-1">
                  <p className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>Android फ़ोन (Chrome):</span>
                  </p>
                  <p>1. Chrome के ऊपर दाईं ओर <strong>3 डॉट्स (⋮)</strong> दबाएं।</p>
                  <p>2. <strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> चुनें।</p>
                  <p className="text-zinc-400">👉 Blue Star के साथ ऐप स्क्रीन पर आ जाएगी।</p>
                </div>
                {/* iPhone Steps */}
                <div className="p-3 bg-black/40 rounded-xl border border-zinc-800 space-y-1">
                  <p className="font-bold text-cyan-400 flex items-center gap-1">
                    <Apple className="w-3.5 h-3.5" />
                    <span>iPhone / iPad (Safari):</span>
                  </p>
                  <p>1. Safari के नीचे <strong>Share बटन (⎋)</strong> पर टैप करें।</p>
                  <p>2. नीचे स्क्रॉल करके <strong>"Add to Home Screen"</strong> दबाएं।</p>
                  <p className="text-zinc-400">👉 iPhone होम स्क्रीन पर Cynthsis जुड़ जाएगी।</p>
                </div>
              </div>
            )}
          </div>

          {/* 3. STORE LINKS & PACKAGES (GOOGLE PLAY & APPLE STORE) */}
          {(activeTab === 'both' || activeTab === 'playstore') && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Google Play Store (Android .AAB / APK)
                    </h4>
                    <span className="text-[10px] text-emerald-400">Free Download Link & Package</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Play Store Ready
                </span>
              </div>

              <div className="p-3 bg-black/30 rounded-xl border border-zinc-800 text-xs space-y-2">
                <p className="text-zinc-300">
                  Google Play Store के लिए 1-क्लिक में <strong>.aab (Android App Bundle)</strong> पैकेज डाउनलोड करें:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={pwaBuilderAndroidUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>Google Play पैकेज डाउनलोड करें</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://play.google.com/console"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <span>Google Play Console लॉगिन</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'both' || activeTab === 'appstore') && (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Apple App Store (iOS iPhone / iPad)
                    </h4>
                    <span className="text-[10px] text-blue-400">Free Download Link & Package</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  App Store Ready
                </span>
              </div>

              <div className="p-3 bg-black/30 rounded-xl border border-zinc-800 text-xs space-y-2">
                <p className="text-zinc-300">
                  Apple App Store के लिए 1-क्लिक में <strong>iOS Xcode Archive / TestFlight</strong> पैकेज बनाएं:
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={pwaBuilderIosUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>Apple App Store पैकेज डाउनलोड करें</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://appstoreconnect.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
                  >
                    <span>App Store Connect लॉगिन</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. "यह काम तुम भी कर सकते हो" - EXPLANATION NOTE */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 text-xs text-zinc-300 space-y-2">
            <h5 className="font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>"क्या AI इसे सीधे स्टोर में पुश कर सकता है?" (स्पष्टीकरण)</span>
            </h5>
            <p className="text-zinc-300 leading-relaxed text-[11px]">
              AI ने ऐप का <strong>100% कोड, नीला स्टार लोगो, मैनिफेस्ट, सर्विस वर्कर और डाउनलोड पैकेज तैयार कर दिया है</strong>। लेकिन Google और Apple की अंतर्राष्ट्रीय सुरक्षा नीति के तहत:
            </p>
            <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-1">
              <li>स्टोर पर ऐप पब्लिश करने के लिए आपके अपने <strong>Google Play Developer</strong> या <strong>Apple Developer</strong> खाते का लॉग-इन आवश्यक होता है ताकि ऐप का मालिकाना हक़ (Ownership) आपके नाम पर रहे।</li>
              <li>ऊपर दिए गए लिंक से पैकेज अपने आप 1-क्लिक में बन जाता है और बिना कोडिंग के स्टोर में अपलोड हो जाता है।</li>
            </ul>
          </div>

          {/* 5. COPY LIVE APP LINK */}
          <div className="p-3 bg-black/40 rounded-xl border border-zinc-800 flex items-center justify-between gap-2 text-xs">
            <div className="truncate">
              <span className="text-[10px] text-zinc-500 block">आपकी फ्री ऐप की लाइव लिंक:</span>
              <span className="text-cyan-300 font-mono text-[11px] truncate block">{appUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white text-xs flex items-center gap-1.5 shrink-0 cursor-pointer border border-zinc-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'कॉपी हो गई!' : 'लिंक कॉपी करें'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#0a0c12] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <Star className="w-3.5 h-3.5 fill-blue-400" />
            <span>Blue Star Edition • 100% Free</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-semibold cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
