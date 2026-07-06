# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



## ios 测试包添加设备
1，输入 eas device:create
2，会出现交互式引导
3，选择 input uuid 的那一条。
4，输入ios设备的uuid.
5，设置设备名称。
6，选择设备类型。
7，确认完成后，就把ios设备添加到测试包了,然后需要更新ios文件夹。
8，pnpm exec expo prebuild  
9，eas build --platform ios --profile development --local
10，选择设备时可以通过y来指定设备，n为选择所有设备，此处设备列表是在 device:create 时添加的设备。
11，eas device:list 查看已添加设备的列表
12，只有测试开发包需要添加设备，正式包走的是 appstore
13，如果新增的插件需要使用原生功能，请求权限，则需要重新打 debug 包

## 命令
## 打包必须指定 expo 通道 production 或者 development
// 线上打ios包
 eas build --platform ios

// 线上打安卓包
eas build --platform android

//本地打包
// ios 线上打包也挺快，四五分钟左右，可以优先使用线上打包。
//安卓本地打包和线上打包用的都是存储云端的 jks 证书
eas build --platform ios --profile development --local
eas build --platform ios --profile production --local

eas build --platform android --profile development --local
eas build --platform android --profile production --local

// 生成ios android 文件夹 会清除安卓ios当前缓存覆盖文件，慎用
npx expo prebuild 

//重新生成原生文件夹（清除之前的原生修改）。
npx expo prebuild --clean

# !!!只更新配置（保留自定义原生代码），修改完 app.json 后必须要执行一遍，更新android ios 文件夹内容
pnpm exec expo prebuild

## 热更新必看

//通过 EAS Update 推送到某个通道，无需提交git
eas update --branch production --message "test update 001"

什么能更新，什么不能？

能更新：JS 代码、样式、图片、字体等资源文件。
不能更新：app.json 中的原生配置（如权限修改）、原生依赖包（如添加了 expo-camera）、App 的 Icon 和启动图。如果改了这些，必须重新 eas build 提审应用商店！
RuntimeVersion 隔离机制：
假设你的 App 版本是 1.0.0，你发布了热更新 A。后来你加了原生功能，发布了 1.1.0 版本到商店。此时，运行 1.0.0 的老用户不会收到热更新 A，因为它们的 runtimeVersion 不同（基于 appVersion 策略）。这保护了老用户不会因为缺少原生依赖而白屏崩溃。

回滚操作：
如果热更新发出去后发现有大 Bug 导致白屏，你可以使用 eas update:rollback 命令快速回滚到上一个版本。

强制更新 vs 柔性更新：
默认是柔性更新（下次启动生效）。如果你遇到严重 Bug 需要立刻生效，可以在发布时加上 --force 参数，但这会导致用户在使用过程中 App 突然重启，需谨慎使用：
eas update --branch production --message "紧急修复白屏" --force


