/* ── Ad Manager ──────────────────────────────────────────────────────────────
 *
 * To enable real AdMob ads:
 * 1. npm install @capacitor-community/admob
 * 2. npx cap sync
 * 3. Add your AdMob App ID inside <application> in
 *    android/app/src/main/AndroidManifest.xml:
 *      <meta-data
 *        android:name="com.google.android.gms.ads.APPLICATION_ID"
 *        android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
 * 4. Replace REWARDED_ID / INTERSTITIAL_ID below with your real ad unit IDs.
 *
 * Until then, test IDs are used and on web/dev ads are auto-skipped
 * so the flow can be tested in a browser without a real device.
 */
const AdManager = (() => {
  // Google's public test ad IDs — replace before publishing
  const REWARDED_ID      = 'ca-app-pub-3940256099942544/5224354917';
  const INTERSTITIAL_ID  = 'ca-app-pub-3940256099942544/1033173712';

  let ready = false;

  async function init() {
    if (!window.Capacitor?.isNativePlatform()) return;
    try {
      const { AdMob } = window.Capacitor.Plugins;
      if (!AdMob?.initialize) return;
      await AdMob.initialize({ requestTrackingAuthorization: false });
      ready = true;
    } catch (e) {
      console.warn('[Ads] init failed', e);
    }
  }

  async function showRewarded() {
    // On web / browser: auto-reward so the lives flow is testable without a device
    if (!window.Capacitor?.isNativePlatform()) return true;
    if (!ready) return false;
    try {
      const { AdMob } = window.Capacitor.Plugins;
      await AdMob.prepareRewardVideoAd({ adId: REWARDED_ID });
      const result = await AdMob.showRewardVideoAd();
      return !!(result?.value);
    } catch (e) {
      console.warn('[Ads] rewarded ad failed', e);
      return false;
    }
  }

  async function showInterstitial() {
    // On web / browser: skip silently
    if (!window.Capacitor?.isNativePlatform()) return;
    if (!ready) return;
    try {
      const { AdMob } = window.Capacitor.Plugins;
      await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
      await AdMob.showInterstitial();
    } catch (e) {
      console.warn('[Ads] interstitial failed', e);
    }
  }

  return { init, showRewarded, showInterstitial };
})();
