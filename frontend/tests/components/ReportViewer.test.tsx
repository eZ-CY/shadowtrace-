/** ReportViewer tests (ISSUE-074).
 *  覆盖三态渲染（加载中/未生成/生成中）、报告内容展示、模板降级提示。 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportViewer from "../../src/components/report/ReportViewer";

// jsdom 没有原生 IntersectionObserver，需要 stub 以避免 ReportToc 初始化报错
const MockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
  root: null,
  rootMargin: "",
  thresholds: [],
}));
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

describe("ReportViewer", () => {
  const mockReport = {
    report_id: "rpt-abc12345",
    event_id: "evt-test001",
    title: "数据外泄调查报告",
    summary: "",
    sections: [
      { key: "overview", title: "事件概述", content: "事件概述内容...", data: {} },
      { key: "severity_level", title: "严重级别", content: "高危", data: {} },
      { key: "risk_scoring", title: "风险评分", content: "**高风险** 数据外泄", data: {} },
      { key: "executed_actions", title: "已执行处置", content: "block_ip", data: {} },
      { key: "recommendations", title: "处置建议", content: "加强监控", data: {} },
    ],
    final_verdict: "confirmed_threat",
    risk_score: 85,
    severity: "high",
    version: 1,
    generated_by: null,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 每个测试前重置 mock 调用记录，保证测试间隔离
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 测试1：loading=true 时展示加载旋转动画
  it("shows loading spinner when loading", () => {
    render(<ReportViewer report={null} loading={true} />);
    expect(screen.getByText("加载中...")).toBeDefined();
  });

  // 测试2：无报告且非生成中 → 展示占位提示「报告尚未生成」
  it("shows placeholder when no report and not generating", () => {
    render(<ReportViewer report={null} loading={false} />);
    expect(screen.getByText("报告尚未生成")).toBeDefined();
  });

  // 测试3：事件状态为 reporting → 展示「报告生成中」提示
  it("shows generating message when event is REPORTING", () => {
    render(<ReportViewer report={null} loading={false} eventStatus="reporting" />);
    expect(screen.getByText("报告生成中，请稍候...")).toBeDefined();
  });

  // 测试4：正常报告渲染 → 标题和所有章节标题均出现在 DOM 中
  it("renders report title and sections", () => {
    render(<ReportViewer report={mockReport} loading={false} />);
    expect(screen.getByText("数据外泄调查报告")).toBeDefined();
    expect(screen.getAllByText("事件概述").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("严重级别").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("风险评分").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("已执行处置").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("处置建议").length).toBeGreaterThanOrEqual(1);
  });

  // 测试5：generated_by="template" → 展示模板降级警告
  it("shows template warning when generated_by=template", () => {
    render(
      <ReportViewer
        report={{ ...mockReport, generated_by: "template" }}
        loading={false}
      />,
    );
    expect(screen.getByText("模板生成（LLM 降级）")).toBeDefined();
  });

  // 测试6：章节正文（含 Markdown 标记）以纯文本方式渲染
  it("renders section content as text", () => {
    render(<ReportViewer report={mockReport} loading={false} />);
    expect(screen.getByText("**高风险** 数据外泄")).toBeDefined();
  });
});
