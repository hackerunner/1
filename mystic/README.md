# Starsand

星砂原型局是一个娱乐向的盲选象征沙盘网页。用户只看到神秘图标和名称，把星砂拖入盘面后点击“揭示原型”，再由内置 AI 根据投影源破局、关键关系和行动指南生成带留白的娱乐解读。

## 本地运行

```bash
npm start
```

默认地址是 `http://localhost:4175`。

## AI 环境变量

Render 或本地需要设置：

```bash
OPENAI_API_KEY=你的网关密钥
OPENAI_BASE_URL=https://uni-api.cstcloud.cn/v1
OPENAI_MODEL=deepseek-v3.2
```

密钥不要提交到仓库。`render.yaml` 已经把 `OPENAI_API_KEY` 标为手动配置。
