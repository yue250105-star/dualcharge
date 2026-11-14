# DualCharge 部署指南（免费版 · 免 VPN 可访问 + 自动更新）

本指南使用**免费套餐**将本项目部署为公网可访问的链接：

1. ✅ 分享一个链接即可打开，无需 VPN（服务器在海外负责调用 Gemini，用户浏览器只访问你的域名）
2. ✅ 每次 `git push` 后**自动重新部署**，链接永远不变
3. ✅ 前端 + 后端统一部署在一个服务里
4. ✅ **$0 成本**：平台免费档 + Gemini API 免费额度

---

## 方案对比（2026 年 11 月核实）

| 平台 | 价格 | 限制 | 推荐度 |
|---|---|---|---|
| **Zeabur Free Plan** | $0，无需信用卡 | 闲置后自动休眠，下次访问有几秒冷启动 | ⭐ 首选 |
| Render Free | $0 | 闲置 15 分钟休眠，冷启动约 1 分钟；`onrender.com` 域名国内稳定性一般 | 备选 |
| Railway | 无免费档，仅试用金 | — | 不推荐 |

> 免费档的“休眠”指：一段时间无人访问后服务会睡眠，**下一次访问时自动唤醒**（Zeabur 约几秒，Render 约 1 分钟），链接本身不变。小范围分享完全够用。

---

## 前置准备

| 项目 | 说明 |
|---|---|
| Gemini API Key | AI Studio 里用的那个（https://aistudio.google.com/apikey 查看），本身有免费额度 |
| GitHub 账号 | 存放代码、触发自动部署 |

---

## 第一步：把代码推到 GitHub

```bash
unzip dualcharge-deploy.zip && cd dualcharge-deploy
git init
git add .
git commit -m "init: dualcharge"
# 在 GitHub 新建私有仓库（不勾 README），然后：
git remote add origin https://github.com/你的用户名/dualcharge.git
git branch -M main
git push -u origin main
```

> ⚠️ `.gitignore` 已配好，`.env` 等含 key 的文件不会被提交。

---

## 第二步：Zeabur 免费部署

1. 打开 https://zeabur.com → 用 **GitHub 登录**（选 Free Plan，$0/月，无需绑卡）
2. **Deploy New Service → Deploy from GitHub** → 选 `dualcharge` 仓库
3. Zeabur 自动识别根目录 `Dockerfile`，开始构建（首次约 5–10 分钟）
4. 构建完成后，**Settings → Domains** 里看到分配的子域名，如 `https://dualcharge.zeabur.app`——这就是分享链接
5. 在服务 **Variables** 里添加环境变量：

| 变量名 | 值 |
|---|---|
| `GEMINI_API_KEY` | 你的 Gemini API key |

添加后服务自动重启，约 1 分钟生效。

### 验证

```bash
curl https://你的域名.zeabur.app/api/health
# 期望返回 {"ok":true,"geminiConfigured":true}
```

浏览器打开链接，触发一次 AI 关怀建议，能正常出结果即部署成功。

---

## 第三步（核心）：以后如何更新？

**直接 push 即可，什么都不用改**：

```bash
git add . && git commit -m "update: xxx" && git push
```

Zeabur 检测到 main 分支新提交 → 自动重新构建部署 → **域名和链接完全不变**。

---

## 备选：Render 免费档

1. https://render.com 用 GitHub 登录
2. **New → Web Service → Connect 仓库**，自动识别 Dockerfile
3. Instance Type 选 **Free**（$0）
4. **Environment** 里加 `GEMINI_API_KEY`
5. 部署后 **Settings → Networking** 生成 `xxx.onrender.com` 域名
6. push 代码同样自动重新部署

缺点：闲置 15 分钟休眠，冷启动约 1 分钟；国内访问稳定性不如 Zeabur。

---

## 绑自己的域名（可选）

Zeabur 服务 **Settings → Domains → Add Domain**，按提示在 DNS 服务商处加一条 CNAME 记录。国内 DNS 解析 + 海外服务器，速度和稳定性更好。

---

## 常见问题

**Q：国内用户真的完全不需要 VPN 吗？**
A：对。用户浏览器只访问你的域名；调用 Gemini 的是海外服务器，走的是服务器的网络。

**Q：为什么第一次打开要等几秒？**
A：免费档闲置后会休眠，下次访问自动唤醒（Zeabur 几秒 / Render 约 1 分钟）。之后有访问就不会睡。

**Q：AI 功能不生效 / 降级成本地建议？**
A：检查 `GEMINI_API_KEY` 是否配置、`/api/health` 是否返回 `geminiConfigured: true`；也可能是 key 的免费额度用尽（每日重置）。

**Q：免费额度够几个人用？**
A：Gemini 免费档有每日请求上限，几个人日常试用够用；用户量大了再考虑付费 key 或迁移国内模型方案（DeepSeek 等，成本也极低）。
