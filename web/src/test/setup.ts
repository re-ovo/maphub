import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 自动清理 React 组件
afterEach(() => {
  cleanup();
});

// 可以在这里添加全局的测试设置
// 例如：模拟浏览器 API、设置全局变量等
