# 星图 (Xingtu)

> AI 驱动的智能阅读器，将文档阅读、AI 问答与知识图谱融为一体。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Electron](https://img.shields.io/badge/Electron-33-47848f)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)

## 是什么

星图是一个三栏式桌面阅读器。导入文档后，你可以向 AI 提问任何关于文档的问题，AI 的回答会自动形成结构化笔记。最特别的是，所有文档和笔记之间会以可视化的「星图」呈现——旋转、缩放、连线，你的每一次阅读都成为知识网络中的一颗星。

## 特性

- **三栏布局** — 左侧文档历史，中间阅读区，右侧 AI 对话 + 笔记
- **多格式文档** — 支持 PDF / DOCX / TXT / Markdown 导入，拖拽即可
- **流式 AI 对话** — 基于文档全文的上下文，AI 流式回答，实时打字效果
- **多模型支持** — Claude / DeepSeek / OpenAI / 自定义 OpenAI 兼容 API
- **智能笔记** — 每次问答自动积累成 Markdown 笔记，支持编辑
- **知识星图** — 文档和笔记以力导向图可视化，3D 透视旋转，树状延展
- **子笔记生成** — 点击星图节点深入提问，生成子笔记节点，知识树不断生长
- **深色/浅色主题** — 跟随系统自动切换，Apple 风格设计
- **本地存储** — IndexedDB 持久化，API Key 系统级加密
- **离线可用** — 纯本地应用，数据不外传

## 截图

（运行后截图放这里）

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 33 |
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 状态管理 | Zustand |
| 数据库 | Dexie.js (IndexedDB) |
| AI 集成 | 原生 fetch + SSE 流式解析 |
| 星图渲染 | HTML5 Canvas + 力导向图引擎 |
| 文档解析 | pdfjs-dist + mammoth |
| 构建工具 | electron-vite + Vite |

## 快速开始

### 前提条件

- Node.js >= 18
- 一个 AI API Key（Claude / DeepSeek / OpenAI 任选）

### 安装运行

```bash
# 克隆项目
git clone https://github.com/yourusername/xingtu.git
cd xingtu

# 安装依赖
npm install --legacy-peer-deps

# 启动开发模式
npm run dev

# 构建生产版本
npm run build
```

### 使用流程

1. 点击右上角齿轮图标 → 选择 AI 提供商 → 填入 API Key → 保存
2. 点击左侧栏 + 按钮导入文档，或直接拖拽文件到窗口
3. 在右侧栏输入问题，AI 基于文档内容流式回答
4. 点击右上角星图图标，查看文档和笔记的知识关系图
5. 在星图中点击节点 → 深入提问 → 生成子笔记 → 知识树持续增长

## 项目结构

```
src/
├── main/              # Electron 主进程
│   ├── index.ts       # 窗口创建
│   └── ipc.ts         # IPC 通信
├── preload/           # 预加载脚本
└── renderer/          # React 渲染进程
    ├── components/
    │   ├── sidebar/   # 左侧栏 - 文档历史
    │   ├── viewer/    # 中间栏 - 文档阅读器
    │   ├── ai-panel/  # 右侧栏 - AI 对话 + 笔记
    │   ├── starmap/   # 星图可视化
    │   ├── layout/    # 三栏布局
    │   └── common/    # 通用组件
    ├── stores/        # Zustand 状态
    ├── services/      # AI 服务 + 文档解析 + 力导向引擎
    ├── db/            # Dexie 数据库
    └── styles/        # 全局样式 + 主题系统
```

## 贡献

欢迎提 Issue 和 PR。重大改动请先开 Issue 讨论。

## License

[MIT](LICENSE) © 2026 董佳鑫
