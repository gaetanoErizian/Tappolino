/**
 * Applica le personalizzazioni native dopo `npx cap add android` / `npx cap add ios`.
 * Idempotente: si può rilanciare. Uso: node scripts/native-setup.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const APP_ID = 'it.tappolino.app';
const ADMOB_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const edit = (file, fn) => { const s = readFileSync(file, 'utf8'); const o = fn(s); if (o !== s) writeFileSync(file, o); };
const once = (s, marker, from, to) => (s.includes(marker) ? s : s.replace(from, to));

// ---------- Android ----------
if (existsSync('android')) {
  const man = 'android/app/src/main/AndroidManifest.xml';
  edit(man, (s) => {
    s = once(s, 'xmlns:tools', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"');
    s = once(s, 'screenOrientation', 'android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"');
    s = once(s, 'gms.ads.APPLICATION_ID', '        <provider', `        <!-- AdMob: ID APP. Ora è l'ID di TEST di Google; sostituire prima della pubblicazione (strings.xml). -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="@string/admob_app_id" />

        <provider`);
    s = once(s, 'permission.AD_ID', '    <!-- Permissions -->', `    <!-- Permissions -->
    <!-- App per bambini (Families Policy): nessun identificatore pubblicitario. -->
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove" />`);
    return s;
  });
  edit('android/app/src/main/res/values/strings.xml', (s) => once(s, 'admob_app_id', '</resources>',
    `    <!-- ID app AdMob: ora è l'ID di TEST di Google. Sostituire prima della pubblicazione. -->\n    <string name="admob_app_id">${ADMOB_TEST_APP_ID}</string>\n</resources>`));
  const javaDir = join('android/app/src/main/java', ...APP_ID.split('.'));
  mkdirSync(javaDir, { recursive: true });
  writeFileSync(join(javaDir, 'MainActivity.java'), `package ${APP_ID};

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    /** Schermo intero: barre di sistema nascoste, riappaiono con uno swipe dal bordo. */
    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }
}
`);
  edit('android/app/build.gradle', (s) => {
    s = s.replace(/versionCode \d+\n(\s+)versionName "[^"]*"/, `// versionCode: in CI è il numero di build (deve crescere a ogni caricamento su Play)\n$1versionCode (System.getenv("VERSION_CODE") ?: "1").toInteger()\n$1versionName "1.0.0"`);
    s = once(s, 'signingConfigs', '    buildTypes {\n        release {\n            minifyEnabled false', `    signingConfigs {
        release {
            // Keystore fornito dalla CI (segreti GitHub) o da variabili d'ambiente locali. Mai nel repository.
            def ks = System.getenv("ANDROID_KEYSTORE_PATH")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            if (System.getenv("ANDROID_KEYSTORE_PATH")) signingConfig signingConfigs.release
            minifyEnabled false`);
    return s;
  });
  console.log('✓ android');
}

// ---------- iOS ----------
if (existsSync('ios')) {
  edit('ios/App/App/Info.plist', (s) => {
    const land = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';
    s = s.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*)<array>[\s\S]*?<\/array>/, `$1${land}`);
    s = s.replace(/(<key>UISupportedInterfaceOrientations~ipad<\/key>\s*)<array>[\s\S]*?<\/array>/, `$1${land}`);
    s = once(s, 'UIStatusBarHidden', '<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<true/>',
      '<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>\n\t<key>UIStatusBarHidden</key>\n\t<true/>\n\t<key>UIRequiresFullScreen</key>\n\t<true/>\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>');
    return s;
  });
  writeFileSync('ios/App/App/PrivacyInfo.xcprivacy', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<!-- Nessun tracciamento, nessun dato raccolto. -->
	<key>NSPrivacyTracking</key>
	<false/>
	<key>NSPrivacyTrackingDomains</key>
	<array/>
	<key>NSPrivacyCollectedDataTypes</key>
	<array/>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<!-- @capacitor/preferences salva progressi e acquisto in UserDefaults (solo dentro l'app). -->
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
`);
  edit('ios/App/App.xcodeproj/project.pbxproj', (s) => {
    if (s.includes('PrivacyInfo.xcprivacy')) return s;
    const B = '5A1E0C0E2B7F4D9100A1B2C1', F = '5A1E0C0E2B7F4D9100A1B2C2';
    const cfgBuild = /(\t\t(\w+) \/\* config\.xml in Resources \*\/ = \{isa = PBXBuildFile; fileRef = (\w+) \/\* config\.xml \*\/; \};)/;
    const cfgRef = /(\t\t(\w+) \/\* config\.xml \*\/ = \{isa = PBXFileReference;[^\n]*\})/;
    s = s.replace(cfgBuild, `$1\n\t\t${B} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${F} /* PrivacyInfo.xcprivacy */; };`);
    s = s.replace(cfgRef, `$1\n\t\t${F} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };`);
    s = s.replace(/(\t\t\t\t\w+ \/\* config\.xml \*\/,)/, `$1\n\t\t\t\t${F} /* PrivacyInfo.xcprivacy */,`);
    s = s.replace(/(\t\t\t\t\w+ \/\* config\.xml in Resources \*\/,)/, `$1\n\t\t\t\t${B} /* PrivacyInfo.xcprivacy in Resources */,`);
    return s.replace(/MARKETING_VERSION = [\d.]+;/g, 'MARKETING_VERSION = 1.0.0;');
  });
  console.log('✓ ios');
}

