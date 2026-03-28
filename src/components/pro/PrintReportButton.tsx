"use client";

import { Printer } from "lucide-react";
import { generateClinicalReportHTML, printReport, type ClinicalReportData } from "@/lib/pro/reportExport";

interface PrintReportButtonProps {
  reportData: ClinicalReportData;
  className?: string;
}

export default function PrintReportButton({ reportData, className }: PrintReportButtonProps) {
  const handlePrint = () => {
    const html = generateClinicalReportHTML(reportData);
    printReport(html);
  };

  return (
    <button className={className || "pro-btn-ghost"} onClick={handlePrint}>
      <Printer size={14} />
      列印報告
    </button>
  );
}
