import { parse } from "yaml";
import { template } from "./template";

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		try {
			const url = new URL(request.url);
			const src = url.searchParams.get("url");
			const hasLaiye = url.searchParams.get("laiye");
			if (src) {
				const res = await (
					await fetch(src, {
						...request,
						headers: { ...request.headers, "Content-Type": "application/json" },
					})
				).text();
				const { proxies } = parse(res);
				if (hasLaiye) {
					proxies.unshift({
						name: "laiye-vpn|GPT",
						server: "vpn.laiye.com",
						port: 8600,
						type: "ss",
						cipher: "chacha20-ietf",
						password: "VzaAf8Ax",
						udp: true,
					});
				}
				const proxyList = proxies
					.map(
						(proxy: Record<string, unknown>) => `  - ${JSON.stringify(proxy)}`,
					)
					.join("\n");
				const proxyNames = proxies
					.map((proxy: Record<string, unknown>) => `      - ${proxy.name}`)
					.join("\n");
				const gptProxyNames = proxies
					.filter((proxy: Record<string, string>) =>
						proxy.name.toLocaleUpperCase().includes("GPT"),
					)
					.map((proxy: Record<string, unknown>) => `      - ${proxy.name}`)
					.join("\n");

				const configTemplate = `
port: 7890
socks-port: 7891
allow-lan: true
mode: Rule
log-level: info
external-controller: 9090
proxies:
${proxyList}
proxy-groups:
  - name: 🔰 节点选择
    type: select
    proxies:
${proxyNames}
  - name: ♻️ 自动选择
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${proxyNames}
  - name: 🎥 NETFLIX
    type: select
    proxies:
      - 🔰 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
  - name: ⛔️ 广告拦截
    type: select
    proxies:
      - 🛑 全球拦截
      - 🎯 全球直连
      - 🔰 节点选择
  - name: 🚫 运营劫持
    type: select
    proxies:
      - 🛑 全球拦截
      - 🎯 全球直连
      - 🔰 节点选择
  - name: 🎓 GPT
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${gptProxyNames}
  - name: 🌍 国外媒体
    type: select
    proxies:
      - 🔰 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
  - name: 🌏 国内媒体
    type: select
    proxies:
      - 🔰 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
  - name: Ⓜ️ 微软服务
    type: select
    proxies:
      - 🔰 节点选择
      - ♻️ 自动选择
      - 🎯 全球直连
  - name: 📲 电报信息
    type: select
    proxies:
      - 🔰 节点选择
      - ♻️ 自动选择
  - name: 🍎 苹果服务
    type: select
    proxies:
      - 🔰 节点选择
      - 🎯 全球直连
      - ♻️ 自动选择
  - name: 🎯 全球直连
    type: select
    proxies:
      - DIRECT
  - name: 🛑 全球拦截
    type: select
    proxies:
      - REJECT
      - DIRECT
  - name: 🐟 漏网之鱼
    type: select
    proxies:
      - 🔰 节点选择
      - 🎯 全球直连
      - ♻️ 自动选择
`;
				const encoder = new TextEncoder();
				const encodedContent = encoder.encode(`${configTemplate}${template}`);
				// 创建一个ReadableStream的可读部分
				const stream = new ReadableStream({
					start(controller) {
						controller.enqueue(encodedContent);
						controller.close();
					},
				});

				// 创建包含ReadableStream的Response对象
				const response = new Response(stream, {
					headers: {
						"Content-Type": "application/octet-stream",
						"Content-Disposition": `attachment; filename="clash1.yaml"`,
					},
				});

				return response;
			}
			return new Response("not found", { status: 500 });
		} catch {
			return new Response("server error", { status: 500 });
		}
	},
};
