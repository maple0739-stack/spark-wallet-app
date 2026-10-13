# iOS 云构建

项目 iOS 版本为 `1.0.2`，构建号为 `9`。`.github/workflows/ios.yml` 通过 GitHub Actions 的 macOS runner 打出 ad-hoc IPA，不会将证书或描述文件提交到代码仓库。

## 启动前

1. 把项目提交并推送到有 GitHub Actions 权限的仓库。本地已初始化 Git 仓库并连接到 `maple0739-stack/spark-wallet-app`；请先完成 GitHub 登录，并确认愿意将项目源代码发布到公开仓库。推送前检查待提交文件，不要提交 `node_modules`、`ios/Pods`、`ios/build`、`android/gradle.properties`、Android keystore、IPA、证书、描述文件或 `src/config/privateApiKeys.js`。
2. 在仓库的 Actions secrets 中创建以下三个名称：
   - `IOS_P12_BASE64`：提供的 `.p12` 文件内容经 Base64 编码后的值。
   - `IOS_P12_PASSWORD`：该 `.p12` 文件的密码。
   - `IOS_PROFILE_BASE64`：提供的 `.mobileprovision` 文件内容经 Base64 编码后的值。
   - `AVE_API_KEY`、`NODEREAL_API_KEY`、`TRONGRID_API_KEY`、`TRON_PRO_API_KEY`、`TRON_PRIVATE_KEY`、`ETHERSCAN_API_KEY`：项目原有的 API 凭据，已迁移到本地忽略文件 `src/config/privateApiKeys.js`，线上构建需设置为仓库 Secrets。
3. 在仓库 Actions 页选择 **iOS ad-hoc IPA** → **Run workflow**。成功后从运行记录的 `Spark-ios-1.0.2-9` artifact 下载 IPA。

该描述文件绑定 `wb.uniusc7615.tool6`、团队 `W6V495HVH3`，仅包含 1 台设备，因此生成的 IPA 不能安装到未登记设备上。已有的某些 IPA 是另一个带后缀的 Bundle ID，不能据此认为它们与本描述文件对应。

当前项目为 React Native 0.60.5；首次使用较新的 macOS/Xcode runner 构建时可能遇到老版本依赖兼容性问题。云端日志会给出实际失败原因，不能仅凭本地配置保证构建成功。