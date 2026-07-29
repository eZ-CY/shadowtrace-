/** ReportViewer — 15-chapter report with TOC, export (ISSUE-074).

Sections are rendered in the order returned by the backend
(ReportSectionBuilder.SECTION_SPECS).  The TOC and Markdown export
use CHAPTER_KEYS for stable ordering / dedup.
*/

import { useRef, useEffect } from "react";
import { Alert, Spin, Typography, Divider } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import type { InvestigationReport } from "../../types/report";
import ReportToc from "./ReportToc";
import ReportExportButtons from "./ReportExportButtons";

const { Title, Text } = Typography;

/** Print stylesheet — injected once per page lifecycle.
 *  打印时隐藏侧边栏、页头、目录和导出按钮，让报告内容占满页面。 */
const PRINT_STYLES = `
@media print {
  .shadowtrace-sidebar, .shadowtrace-header, .shadowtrace-toc, .shadowtrace-export-btns {
    display: none !important;
  }
  .shadowtrace-report-viewer { padding: 0 !important; max-width: 100% !important; }
}
`;

interface ReportViewerProps {
  report: InvestigationReport | null;
  loading: boolean;
  eventStatus?: string;
}

/** 调查报告主查看器：15 章报告 + 目录 + 导出功能（ISSUE-074）。
 *  三态渲染：加载中 → 未生成/生成中 → 报告内容。 */
export default function ReportViewer({ report, loading, eventStatus }: ReportViewerProps) {
  // 打印样式 <style> 元素的引用，用于组件卸载时清理
  const printStyleRef = useRef<HTMLStyleElement | null>(null);

  // 挂载时注入打印样式，卸载时移除，避免样式泄漏
  useEffect(() => {
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    printStyleRef.current = style;
    return () => {
      if (printStyleRef.current) {
        document.head.removeChild(printStyleRef.current);
        printStyleRef.current = null;
      }
    };
  }, []);

  // 页面级加载态 — 事件详情仍在拉取中
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          加载中...
        </Text>
      </div>
    );
  }

  // 报告未生成：区分「尚未生成」和「生成中」两种提示
  if (!report || report.sections.length === 0) {
    const isReporting = eventStatus === "reporting";
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          {isReporting ? "报告生成中，请稍候..." : "报告尚未生成"}
        </Text>
      </div>
    );
  }

  // LLM 不可用时回退到模板生成，需在 UI 中提示用户
  const isTemplate = report.generated_by === "template";

  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div className="shadowtrace-toc">
        <ReportToc report={report} />
      </div>

      <div className="shadowtrace-report-viewer" style={{ flex: 1, maxWidth: 800 }}>
        {isTemplate && (
          <Alert
            message="模板生成（LLM 降级）"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="shadowtrace-export-btns" style={{ marginBottom: 16 }}>
          <ReportExportButtons report={report} />
        </div>

        <Title level={4}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {report.title}
        </Title>
        <Text type="secondary">
          判定：{report.final_verdict} | 风险分：{report.risk_score} | 严重程度：{report.severity}
        </Text>

        <Divider />

        {/* 按后端返回的顺序渲染章节，每个章节用 key 作为锚点 id 供 TOC 滚动定位 */}
        {report.sections.map((section) => (
          <div key={section.key} id={section.key} style={{ marginBottom: 32 }}>
            <Title level={5} id={`${section.key}-title`}>
              {section.title}
            </Title>
            {/* whiteSpace: pre-wrap 保留 Markdown 换行，避免内容挤成一行 */}
            <Text style={{ whiteSpace: "pre-wrap" }}>{section.content}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
