// CheckCC 的检测插件注册入口，用于汇总浏览器身份、设备指纹、运行时与一致性校验四大插件。
import type { DetectionPlugin } from "../plugin";
import { browserIdentityPlugin } from "./browser-identity";
import { consistencyPlugin } from "./consistency";
import { deviceFingerprintPlugin } from "./device";
import { runtimePlugin } from "./runtime";

export const detectionPlugins: DetectionPlugin[] = [
  browserIdentityPlugin,
  deviceFingerprintPlugin,
  runtimePlugin,
  consistencyPlugin,
];
