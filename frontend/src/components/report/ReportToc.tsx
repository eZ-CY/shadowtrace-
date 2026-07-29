/** ReportToc — table of contents with scroll-spy highlighting (ISSUE-074). */

import { useEffect, useState } from "react";
import { Anchor, Typography } from "antd";
import { CHAPTER_KEYS } from "../../utils/exportMarkdown";
import type { InvestigationReport } from "../../types/report";

const { Text } = Typography;

interface ReportTocProps {
  report: InvestigationReport;
}

export default function ReportToc({ report }: ReportTocProps) {
  // 当前可见章节的 key，初始为第一章
  const [activeKey, setActiveKey] = useState<string>(CHAPTER_KEYS[0]);

  /** Scroll-spy：用 IntersectionObserver 监听各章节是否进入视口，自动高亮对应目录项。
   *  rootMargin 顶部 -10% 让「接近顶部」的章节提前触发，底部 -80% 要求章节真正进入可视区。 */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // IntersectionObserver 回调可能批量返回多个条目，取第一个相交的
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveKey(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0px -80% 0px" },
    );

    // 为每个已知章节注册观察，只观察实际存在于 DOM 中的元素
    for (const key of CHAPTER_KEYS) {
      const el = document.getElementById(key);
      if (el) observer.observe(el);
    }

    // report_id 变化时重新绑定 observer（报告内容已替换）
    return () => observer.disconnect();
  }, [report.report_id]);

  // 按 CHAPTER_KEYS 稳定顺序构建目录项，只包含实际存在且有标题的章节
  const items = CHAPTER_KEYS
    .filter((k) => report.sections.some((s) => s.key === k && s.title))
    .map((k) => {
      const section = report.sections.find((s) => s.key === k)!;
      return {
        key: k,
        href: `#${k}`,
        title: <Text ellipsis style={{ fontSize: 13 }}>{section.title}</Text>,
      };
    });

  return (
    <div style={{ width: 200, flexShrink: 0, position: "sticky", top: 16 }}>
      <Text strong style={{ fontSize: 14, marginBottom: 8, display: "block" }}>
        目录
      </Text>
      <Anchor
        items={items}
        // 用 scroll-spy 的 activeKey 覆盖 Ant Anchor 默认的 URL hash 匹配
        getCurrentAnchor={() => `#${activeKey}`}
        // 阻止默认锚点跳转，改用平滑滚动
        onClick={(e, link) => {
          e.preventDefault();
          const el = document.getElementById(link.href.replace("#", ""));
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
}
