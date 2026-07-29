/** ReportExportButtons — download Markdown + print (ISSUE-074). */

import { Button, Space } from "antd";
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { downloadReportMarkdown } from "../../utils/exportMarkdown";
import type { InvestigationReport } from "../../types/report";

interface ReportExportButtonsProps {
  report: InvestigationReport;
}

export default function ReportExportButtons({ report }: ReportExportButtonsProps) {
  return (
    <Space>
      {/* 构建 Markdown 并通过 Blob URL 触发浏览器下载 */}
      <Button
        icon={<DownloadOutlined />}
        onClick={() => downloadReportMarkdown(report)}
      >
        下载 Markdown
      </Button>
      {/* 直接调用浏览器打印，打印样式通过 ReportViewer 注入的 @media print 控制 */}
      <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
        打印
      </Button>
    </Space>
  );
}
