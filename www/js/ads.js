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
 * 4. Replace REWARDED_ID below with your real rewarded ad unit ID.
 *
 * Until then, the test ID is used and on web/dev the ad is auto-skipped
 * so the lives flow can be tested in a browser without a real device.
 */
const AdManager = (() => {
  // Google's public test rewarded ad ID — replace before publishing
  const REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

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

  return { init, showRewarded };
})();
