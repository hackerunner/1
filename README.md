# MindSand 心理分析沙盘

一个可部署到 Render 的网页版沙盘原型。它支持拖拽微缩物、划沙、空间/象征线索分析、本地保存、服务器 JSONL 保存和 Markdown 报告导出。

## 运行

```powershell
cd sandplay-analysis
npm install
npm start
```

默认地址：`http://localhost:4175`

## Render 部署

1. 将仓库推到 GitHub。
2. 在 Render 新建 Blueprint 或 Web Service，根目录选择 `sandplay-analysis`。
3. 使用 `render.yaml`，或手动设置：
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `DATA_DIR=/var/data`
   - Disk: 挂载到 `/var/data`
4. 如需限制导出接口，设置环境变量 `ADMIN_KEY`。
5. 如需启用 AI 深度解读，在 Render 环境变量中设置：
   - `OPENAI_API_KEY`：服务端调用 OpenAI API 的密钥，不要放到前端代码。
   - `OPENAI_MODEL`：默认 `gpt-5.4-mini`，可按账号可用模型调整。

## 数据接口

- `POST /api/sessions`：保存一次匿名沙盘记录。
- `POST /api/ai-analysis`：基于沙盘结构、来访者讲述和咨询师记录生成 AI 深度解读。
- `GET /api/ai-status`：查看当前服务端是否已配置 AI。
- `GET /api/export.json?key=ADMIN_KEY`：导出全部记录。
- `GET /api/export.csv?key=ADMIN_KEY`：导出 CSV。
- `GET /api/count?key=ADMIN_KEY`：查看记录数。

如果没有设置 `ADMIN_KEY`，导出接口不鉴权，公开部署时建议设置。

## 专业边界

MindSand 的分析是反思性假设，不是诊断结论。正式咨询、学校或临床使用时，应取得知情同意，并由受训咨询师结合来访者叙事、情绪、文化背景、治疗关系和纵向变化来解释。

研究依据整理在 [RESEARCH_NOTES.md](./RESEARCH_NOTES.md)。
