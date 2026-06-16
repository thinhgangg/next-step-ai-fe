import { useState } from "react";
import { AppShell } from "@/shared/ui/app-shell";

type Status = "ok" | "warn" | "fail";

type CheckItem = {
  label: string;
  status: Status;
  text: string;
  link?: string;
};

const searchability: CheckItem[] = [
  {
    label: "Contact Information",
    status: "fail",
    text: "We did not find an address, email, and phone number in your resume. Add complete contact details so recruiters can validate location and contact you quickly.",
    link: "Update scan information",
  },
  {
    label: "Summary",
    status: "ok",
    text: "We found a summary section in your resume. Good job! It helps recruiters quickly understand your value.",
  },
  {
    label: "Section Headings",
    status: "ok",
    text: "We found both education and work experience sections in your resume.",
  },
  {
    label: "Job Title Match",
    status: "fail",
    text: "The exact Senior Product Manager title was not found in your resume. Include the exact title in your headline or summary.",
    link: "Update scan information",
  },
  {
    label: "Date Formatting",
    status: "ok",
    text: "ATS and recruiters prefer specific date formats like MM/YYYY or Month YYYY.",
  },
  {
    label: "Education Match",
    status: "ok",
    text: "The job description does not require a specific education level, and your education section is present.",
    link: "Update required education level",
  },
  {
    label: "File Type",
    status: "ok",
    text: "You are using a PDF file, which is preferred for ATS systems. Your file name is concise and readable.",
  },
];

const recruiterTips: CheckItem[] = [
  {
    label: "Job Level Match",
    status: "warn",
    text: "You may have more years of experience than this role requires. Add a short note to explain your motivation for this role.",
  },
  {
    label: "Measurable Results",
    status: "ok",
    text: "There are multiple mentions of measurable results in your resume. Keep this up.",
    link: "View Measurable Results",
  },
  {
    label: "Paragraph Length",
    status: "fail",
    text: "Some paragraphs are longer than 40 words. Shorten them for readability.",
    link: "View Paragraph Length",
  },
  {
    label: "Resume Tone",
    status: "warn",
    text: "We found some negative phrases or cliches in your resume.",
    link: "View Negative Words",
  },
  {
    label: "Web Presence",
    status: "fail",
    text: "Consider adding your website or LinkedIn URL to improve credibility.",
  },
];

const formatting: CheckItem[] = [
  {
    label: "Font Check",
    status: "ok",
    text: "Your resume uses readable fonts with consistent style and hierarchy.",
  },
  {
    label: "Layout",
    status: "ok",
    text: "No tables or images in critical sections. Layout is ATS-friendly.",
  },
  {
    label: "Page Setup",
    status: "ok",
    text: "Margins and page setup are consistent and standard.",
  },
];

const hardSkills = [
  ["Mobile", "8", "9"],
  ["Product", "35", "7"],
  ["Product management", "7", "6"],
  ["Android", "4", "3"],
  ["Focus", "x", "3"],
  ["Customer experience", "x", "2"],
  ["Mobile commerce", "x", "2"],
  ["Windows", "7", "2"],
  ["Management experience", "x", "1"],
  ["Mobile platforms", "x", "1"],
];

const softSkills = [
  ["Innovation", "x", "2"],
  ["Strategic thinking", "x", "1"],
  ["High quality", "1", "1"],
  ["Competitive", "3", "1"],
  ["Proactively", "1", "1"],
  ["Judgment", "x", "1"],
];

function statusColor(status: Status) {
  if (status === "ok") return "text-primary";
  if (status === "warn") return "text-amber-500";
  return "text-destructive";
}

export function SampleReportPage() {
  const [tab, setTab] = useState<"resume" | "jd">("resume");

  return (
    <AppShell
      fullWidth
      headerTitle="Báo cáo mẫu"
      headerDescription="Xem mẫu báo cáo so khớp CV với JD mục tiêu."
    >
      <div className="space-y-4 pb-12">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-[11px] text-muted-foreground">
            Resume scan results
          </p>
          <h1 className="text-[15px] font-semibold text-foreground">
            Amazon - Product Manager
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-4">
          <aside className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Match Rate
            </p>
            <div className="mb-3 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-primary/70 text-3xl font-bold text-primary">
                72
                <span className="ml-1 text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <button className="mb-3 w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Upload & rescan
            </button>
            <div className="space-y-2 text-[11px]">
              {[
                ["Searchability", 62, "5 issues to fix"],
                ["Hard Skills", 45, "11 issues to fix"],
                ["Soft Skills", 55, "3 issues to fix"],
                ["Recruiter Tips", 35, "4 issues to fix"],
                ["Formatting", 90, ""],
              ].map(([label, score, fix]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-foreground">{label}</span>
                    <span className="text-foreground">{fix}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border">
                    <div
                      className={`h-1.5 rounded-full ${
                        Number(score) >= 70
                          ? "bg-primary"
                          : Number(score) >= 50
                            ? "bg-amber-500"
                            : "bg-destructive"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="space-y-6">
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab("resume")}
                className={`px-6 py-2 text-sm font-medium ${tab === "resume" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Resume Report
              </button>
              <button
                onClick={() => setTab("jd")}
                className={`px-6 py-2 text-sm font-medium ${tab === "jd" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                Job Description
              </button>
            </div>

            {tab === "resume" ? (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    ATS-Specific Tips: Adding company name and website can
                    improve ATS-specific recommendations.
                  </p>
                  <span className="rounded bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                    ATS tip
                  </span>
                </div>

                <section>
                  <h2 className="mb-1 text-2xl font-bold text-foreground">
                    Searchability
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Fix red items first to make your resume easier to parse and
                    discover in ATS.
                  </p>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    {searchability.map((item, idx) => (
                      <div
                        key={item.label}
                        className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 px-4 py-3 ${idx < searchability.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span
                            className={`mr-2 font-semibold ${statusColor(item.status)}`}
                          >
                            {item.status === "ok"
                              ? "OK"
                              : item.status === "warn"
                                ? "!"
                                : "X"}
                          </span>
                          {item.text}{" "}
                          {item.link ? (
                            <button className="text-xs font-semibold text-primary hover:underline">
                              {item.link}
                            </button>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-1 text-2xl font-bold text-foreground">
                    Hard skills
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <div className="grid grid-cols-3 bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>Skill</span>
                      <span>Resume</span>
                      <span>Job Description</span>
                    </div>
                    {hardSkills.map(([skill, resume, jd]) => (
                      <div
                        key={skill}
                        className="grid grid-cols-3 border-t border-border px-4 py-2 text-sm text-foreground"
                      >
                        <span>{skill}</span>
                        <span
                          className={resume === "x" ? "text-destructive" : ""}
                        >
                          {resume}
                        </span>
                        <span>{jd}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-1 text-2xl font-bold text-foreground">
                    Soft skills
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <div className="grid grid-cols-3 bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span>Skill</span>
                      <span>Resume</span>
                      <span>Job Description</span>
                    </div>
                    {softSkills.map(([skill, resume, jd]) => (
                      <div
                        key={skill}
                        className="grid grid-cols-3 border-t border-border px-4 py-2 text-sm text-foreground"
                      >
                        <span>{skill}</span>
                        <span
                          className={resume === "x" ? "text-destructive" : ""}
                        >
                          {resume}
                        </span>
                        <span>{jd}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-1 text-2xl font-bold text-foreground">
                    Recruiter tips
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    {recruiterTips.map((item, idx) => (
                      <div
                        key={item.label}
                        className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 px-4 py-3 ${idx < recruiterTips.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span
                            className={`mr-2 font-semibold ${statusColor(item.status)}`}
                          >
                            {item.status === "ok"
                              ? "OK"
                              : item.status === "warn"
                                ? "!"
                                : "X"}
                          </span>
                          {item.text}{" "}
                          {item.link ? (
                            <button className="text-xs font-semibold text-primary hover:underline">
                              {item.link}
                            </button>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-1 text-2xl font-bold text-foreground">
                    Formatting
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    {formatting.map((item, idx) => (
                      <div
                        key={item.label}
                        className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1.5 sm:gap-3 px-4 py-3 ${idx < formatting.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="mr-2 font-semibold text-foreground">
                            OK
                          </span>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="rounded-lg border border-border bg-card p-8">
                <h2 className="mb-4 text-2xl font-bold text-foreground">
                  Product Manager
                </h2>
                <p className="leading-7 text-foreground">
                  Mobile Shopping is one of Amazon's fastest-growing
                  businesses. The Mobile team builds customer experiences across
                  markets and platforms, including phones, tablets, browsers,
                  and shopping apps. This sample role looks for a senior
                  product manager who can lead engagement initiatives across
                  mobile platforms, balance strategy with execution, and drive
                  strong customer outcomes.
                </p>
                <p className="mt-4 leading-7 text-foreground">
                  Basic Qualifications: 5-7+ years of product management
                  experience in a technology company, 3+ years of
                  consumer-facing mobile commerce experience, and strong
                  strategic thinking, innovation, and execution skills.
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
