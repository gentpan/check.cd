// 国家代码对应 public/flags 里的矩形国旗。
export function Flag({ code, large = false }: { code: string; large?: boolean }) {
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      width={large ? 48 : 20}
      height={large ? 32 : 14}
      className={`country-flag${large ? " country-flag-large" : ""}`}
    />
  );
}
