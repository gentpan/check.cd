// 浏览器可调用的 IP 纯净度查询。实际请求在服务端完成。
import { createServerFn } from "@tanstack/react-start";
import type { IpPurityReport } from "@/server/ip-purity";
import { validateAddressRequest, validateIpRequest } from "./input-validation";

export type { IpPurityReport };

export const fetchIpPurity = createServerFn({ method: "POST" })
  .validator(validateIpRequest)
  .handler(async ({ data }): Promise<IpPurityReport> => {
    const { lookupVisitorPurity } = await import("@/server/ip-purity");
    return lookupVisitorPurity(data.locale);
  });

export const fetchCheckedIp = createServerFn({ method: "POST" })
  .validator(validateAddressRequest)
  .handler(async ({ data }): Promise<IpPurityReport> => {
    const { lookupAddress } = await import("@/server/ip-purity");
    return lookupAddress(data.ip, data.locale);
  });
