/** Markdown export utility (ISSUE-074). */

import type { InvestigationReport } from "../types/report";

/** 15 chapter keys matching backend ReportSectionBuilder.SECTION_KEYS (ISSUE-036).
 *  用于 Markdown 导出和 TOC 的稳定排序与去重。 */
const CHAPTER_KEYS = [
  "overview", "severity_level", "risk_scoring", "involved_accounts",
  "involved_assets", "involved_processes", "involved_files",
  "involved_external_addresses", "evidence_chain", "attack_storyline",
  "attack_mapping", "executed_actions", "verification_results",
  "recommendations", "appendix_index",
] as const;

/** Build a complete Markdown document from report sections.
 *  依次拼接：标题 → 元信息（ID/判定/风险分/严重程度）→ 各章节内容。
 *  章节按 CHAPTER_KEYS 顺序排列，只包含有内容的章节。 */
export function buildReportMarkdown(report: InvestigationReport): string {
  const lines: string[] = [];
  // 一级标题
  lines.push(`# ${report.title}`);
  lines.push("");
  // 报告元信息
  lines.push(`- **报告 ID**: ${report.report_id}`);
  lines.push(`- **事件 ID**: ${report.event_id}`);
  lines.push(`- **最终判定**: ${report.final_verdict}`);
  lines.push(`- **风险评分**: ${report.risk_score}`);
  lines.push(`- **严重程度**: ${report.severity}`);
  // 模板生成警告
  if (report.generated_by === "template") {
    lines.push("");
    lines.push("> ⚠️ 模板生成（LLM 降级）");
  }
  lines.push("");

  // 按稳定 key 顺序输出章节，跳过空内容章节
  for (const key of CHAPTER_KEYS) {
    const section = report.sections.find((s) => s.key === key);
    if (!section || !section.content) continue;
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  return lines.join("\n");
}

/** Download a Markdown file for the report.
 *  通过 Blob URL + 临时 <a> 标签触发浏览器下载，无需后端接口。
 *  SSR / jsdom 测试环境下静默降级。 */
export function downloadReportMarkdown(report: InvestigationReport): void {
  try {
    const md = buildReportMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    // 创建临时 <a> 标签模拟点击下载
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadowtrace-report-${report.event_id}.md`;
    document.body.appendChild(a);
    a.click();
    // 清理：移除临时元素并释放 Blob URL 内存
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // SSR / test environment — silently no-op
  }
}

export { CHAPTER_KEYS };
