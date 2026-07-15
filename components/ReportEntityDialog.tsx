"use client";
import { Flag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";
import { useEntityReport } from "@/lib/hooks/useEntityReport";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam" },
  { value: "plagiarism", label: "Plagiarism or stolen content" },
  { value: "inaccurate", label: "Inaccurate or broken stats" },
  { value: "other", label: "Other" },
];

const isReportReason = (value: string): value is ReportReason =>
  REPORT_REASONS.some((r) => r.value === value);

interface ReportEntityDialogProps {
  entityType: ReactableEntityType;
  entityId: string;
  entityLabel: string;
}

export function ReportEntityDialog({
  entityType,
  entityId,
  entityLabel,
}: ReportEntityDialogProps) {
  const { hasReported, report, isReportPending } = useEntityReport(
    entityType,
    entityId
  );
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!reason) return;
    await report(reason, details);
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title={
            hasReported
              ? `You've already reported this ${entityLabel.toLowerCase()}`
              : "Report"
          }
          disabled={hasReported}
        >
          <Flag className="w-4 h-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {entityLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a reason for reporting this {entityLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={reason}
          onValueChange={(value) => {
            if (isReportReason(value)) setReason(value);
          }}
        >
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <RadioGroupItem value={r.value} id={`report-reason-${r.value}`} />
              <Label htmlFor={`report-reason-${r.value}`}>{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className="space-y-2">
          <Label htmlFor="report-details">Additional details (optional)</Label>
          <Textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!reason || isReportPending}>
            Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
