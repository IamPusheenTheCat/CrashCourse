# CrashCourse

A Tinder-style North American driver's license exam prep app. Swipe to answer, get it wrong and watch a crash video to remember why the rule matters.

## Tech Stack

- **React 19 + TypeScript** — UI
- **Vite** — Build
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Swipe card physics & animations
- **Zustand** — State management
- **Capacitor** — iOS & Android native wrapper
- **React Router** — Navigation

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run in browser (dev mode)
npm run dev
```

Open http://localhost:5173/

## Deploy to iPhone (via USB)

Requires: **Xcode** (free from App Store) + **Apple ID** (free, no paid developer account needed)

```bash
# 1. Build web assets
npm run build

# 2. Sync to iOS project
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

Then in Xcode:
1. Select your iPhone (connected via USB)
2. **Signing & Capabilities** → set **Team** to your own Apple ID
3. Change **Bundle Identifier** to something unique (e.g. `com.crashcourse.yourname`)
4. Click **▶ Run**

> Free Apple ID limitation: app expires after 7 days, just re-Run to refresh.

## Deploy to Android（生成真实 APK）

同一套代码，先构建 Web 再同步到 Android 即可打包成可安装的安卓应用。

**环境**：本机需安装 [Android Studio](https://developer.android.com/studio)（或至少 JDK 17+ 和 Android SDK）。

```bash
# 1. 构建 Web 并同步到双平台（iOS + Android）
npm run cap:sync

# 2. 用 Android Studio 打开（可选，用于调试或签名）
npm run cap:android
```

### 生成可安装的 APK

**方式一：命令行打 Debug 包（无需签名，可直接安装到手机/模拟器）**

```bash
npm run android:debug
```

生成的 APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`。  
用数据线连接手机并开启「USB 调试」，或拖到模拟器里即可安装。

**方式二：打 Release 包（上架或分发给他人）**

1. 在 Android Studio 中打开项目：`npm run cap:android`
2. **Build → Generate Signed Bundle / APK** → 选 **APK**（或 AAB 上架 Play 商店）
3. 创建或选择 keystore，按向导完成签名  
4. 完成后 APK 在 `android/app/release/` 或你选择的输出目录

若要用命令行打 release（需先配置签名），可运行：

```bash
npm run android:release
```

未配置 signing 时可能失败，需在 `android/app/build.gradle` 的 `buildTypes.release` 中配置 `signingConfig`。

---

## Project Structure

```
src/
├── data/questions.ts       # Quiz questions + video mappings
├── stores/quizStore.ts     # Zustand store (progress, answers, favorites)
├── components/
│   ├── AppShell.tsx         # Layout: background + status bar + tab bar
│   ├── SwipeCard.tsx        # Draggable quiz card (framer-motion)
│   ├── VideoOverlay.tsx     # Full-screen wrong-answer video
│   ├── TabBar.tsx           # Bottom navigation
│   └── GlassCard.tsx        # Reusable glass panel
├── screens/
│   ├── TutorialScreen.tsx   # Onboarding carousel
│   ├── LoginScreen.tsx
│   ├── MenuScreen.tsx       # Practice / Review / Settings
│   ├── QuizScreen.tsx       # Main quiz loop
│   ├── ReviewScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SettingsScreen.tsx
public/
└── tutorialVideos/          # Onboarding demo videos (local). Wrong-answer videos come from API `warning_video_url` (e.g. Supabase Storage).
```

## For Teammates

After cloning:
```bash
npm install
npm run cap:sync
npx cap open ios    # 或 npx cap open android
```
Then set your own Apple ID in Xcode Signing & Capabilities (iOS), or run `npm run android:debug` to get a debug APK (Android).
