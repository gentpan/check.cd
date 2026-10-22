import { createServerFn } from "@tanstack/react-start";
export const getServiceStatus = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/service-status")).readServiceStatus(),
);

export const getStatusDetail = createServerFn({method:"GET"})
  .validator((value:unknown)=>{const id=(value as {id?:unknown})?.id;if(typeof id!=="string" || !/^[a-zA-Z0-9]{1,80}$/.test(id)) throw new Error("Invalid event id");return {id};})
  .handler(async({data})=>(await import("@/server/service-status")).readStatusDetail(data.id));
