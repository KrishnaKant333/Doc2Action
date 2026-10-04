/**
 * Realistic mock data for Document -> Action Automator
 * Used for development, testing, and hackathon demonstration.
 */

import { AnalysisResult } from "../types/action";

export interface SampleDocumentItem {
  id: string;
  name: string;
  categoryLabel: string;
  description: string;
  sampleFile: {
    name: string;
    sizeBytes: number;
    mimeType: string;
  };
  result: AnalysisResult;
}

/**
 * Sample 1: College Academic Notice
 */
export const collegeNoticeResult: AnalysisResult = {
  document: {
    id: "doc-college-001",
    name: "college_circular_capstone_2026.pdf",
    sizeBytes: 245760, // 240 KB
    mimeType: "application/pdf",
    uploadedAt: "2026-10-04T10:30:00.000Z",
    pageCount: 2,
    rawText: "Department of Computer Engineering - Circular No. 42/2026. All final year students must submit the project report by 15 October 2026...",
  },
  metrics: {
    totalActions: 3,
    totalDeadlines: 2,
    totalEvents: 1,
    highPriorityCount: 2,
  },
  actions: [
    {
      id: "act-col-1",
      title: "Submit project report",
      description: "Final capstone report and source code repository link must be uploaded to the department portal.",
      deadline: "15 October 2026",
      priority: "high",
      category: "academic",
      status: "pending",
      sourceSnippet: "Submit the project report by 15 October 2026 on the department portal.",
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
    {
      id: "act-col-2",
      title: "Pay semester examination fee",
      description: "Online payment counter closes at 4:00 PM; a late fee of ₹500 applies thereafter.",
      deadline: "18 October 2026",
      priority: "high",
      category: "finance",
      status: "pending",
      sourceSnippet: "Examination fee payment must be completed before 18 October 2026, 4:00 PM.",
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
    {
      id: "act-col-3",
      title: "Attend mandatory project defense demo",
      description: "All team members must be present with functioning hardware and presentation slides in Seminar Hall B.",
      deadline: "22 October 2026",
      priority: "medium",
      category: "academic",
      status: "pending",
      sourceSnippet: "Oral defense and system demonstration scheduled on 22 October 2026.",
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
  ],
  deadlines: [
    {
      id: "dl-col-1",
      title: "Project Report Submission",
      dueDate: "15 October 2026, 11:59 PM",
      isStrict: true,
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
    {
      id: "dl-col-2",
      title: "Semester Examination Fee Cutoff",
      dueDate: "18 October 2026, 04:00 PM",
      isStrict: true,
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
  ],
  events: [
    {
      id: "ev-col-1",
      title: "Capstone Oral Defense & System Demo",
      date: "22 October 2026, 10:00 AM - 02:00 PM",
      location: "Seminar Hall B, Block 2",
      sourceDocument: "college_circular_capstone_2026.pdf",
    },
  ],
  importantNotes: [
    "Late project submissions incur an automatic 10% grade penalty per day.",
    "Submission portal credentials will be locked after the cutoff timestamp.",
    "A physical copy with guide's signature must also be archived with the library.",
  ],
  processingDurationMs: 1420,
};

/**
 * Sample 2: Seminar / Conference Call for Papers
 */
export const symposiumCircularResult: AnalysisResult = {
  document: {
    id: "doc-symposium-002",
    name: "tech_symposium_call_for_papers.pdf",
    sizeBytes: 524288, // 512 KB
    mimeType: "application/pdf",
    uploadedAt: "2026-10-04T10:35:00.000Z",
    pageCount: 3,
  },
  metrics: {
    totalActions: 3,
    totalDeadlines: 2,
    totalEvents: 1,
    highPriorityCount: 1,
  },
  actions: [
    {
      id: "act-sym-1",
      title: "Submit research paper abstract",
      description: "Submit 300-word structured abstract adhering to IEEE standard format.",
      deadline: "20 October 2026",
      priority: "high",
      category: "academic",
      status: "pending",
      sourceSnippet: "Paper abstracts must be submitted via EasyChair before 20 October 2026.",
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
    {
      id: "act-sym-2",
      title: "Complete early-bird attendee registration",
      description: "Register on the symposium portal to claim subsidized student delegate passes.",
      deadline: "25 October 2026",
      priority: "medium",
      category: "event",
      status: "pending",
      sourceSnippet: "Early registration discount valid until 25 October 2026.",
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
    {
      id: "act-sym-3",
      title: "Prepare presentation poster",
      description: "Accepted posters must follow A1 portrait format with project contact QR code.",
      deadline: "02 November 2026",
      priority: "low",
      category: "event",
      status: "pending",
      sourceSnippet: "Poster presentations should be printed and verified by 2 November 2026.",
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
  ],
  deadlines: [
    {
      id: "dl-sym-1",
      title: "Abstract Submission Deadline",
      dueDate: "20 October 2026, 11:59 PM UTC",
      isStrict: true,
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
    {
      id: "dl-sym-2",
      title: "Early-Bird Registration Cutoff",
      dueDate: "25 October 2026, 05:00 PM",
      isStrict: false,
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
  ],
  events: [
    {
      id: "ev-sym-1",
      title: "National Tech Symposium & Keynote Sessions",
      date: "05-06 November 2026, 09:00 AM",
      location: "Grand Auditorium & Virtual Stream",
      sourceDocument: "tech_symposium_call_for_papers.pdf",
    },
  ],
  importantNotes: [
    "Accepted submissions will be indexed in national digital proceedings.",
    "Student delegates must produce a valid institutional identity card at registration.",
  ],
  processingDurationMs: 1680,
};

/**
 * Sample 3: Administrative / Office Invoice Notice
 */
export const officeNoticeResult: AnalysisResult = {
  document: {
    id: "doc-admin-003",
    name: "office_lease_and_utilities_notice.pdf",
    sizeBytes: 153600, // 150 KB
    mimeType: "application/pdf",
    uploadedAt: "2026-10-04T10:40:00.000Z",
    pageCount: 1,
  },
  metrics: {
    totalActions: 3,
    totalDeadlines: 2,
    totalEvents: 1,
    highPriorityCount: 1,
  },
  actions: [
    {
      id: "act-adm-1",
      title: "Settle electricity and HVAC surcharge",
      description: "Invoice #INV-2026-8812 payable via wire transfer or tenant portal.",
      deadline: "10 October 2026",
      priority: "high",
      category: "finance",
      status: "pending",
      sourceSnippet: "Payment of utilities surcharge is due strictly on or before 10 October 2026.",
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
    {
      id: "act-adm-2",
      title: "Submit annual fire safety audit certificate",
      description: "Provide certified compliance report signed by authorized building safety inspector.",
      deadline: "28 October 2026",
      priority: "medium",
      category: "administrative",
      status: "pending",
      sourceSnippet: "Tenants must furnish fire safety compliance certificates by 28 October 2026.",
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
    {
      id: "act-adm-3",
      title: "Review quarterly lease extension terms",
      description: "Submit written letter of intent regarding tenancy renewal for fiscal year 2027.",
      deadline: "15 November 2026",
      priority: "low",
      category: "administrative",
      status: "pending",
      sourceSnippet: "Renewal notices must be formally submitted 45 days prior to lease expiry.",
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
  ],
  deadlines: [
    {
      id: "dl-adm-1",
      title: "Utility Invoice Payment",
      dueDate: "10 October 2026, 06:00 PM",
      isStrict: true,
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
    {
      id: "dl-adm-2",
      title: "Safety Audit Compliance Document",
      dueDate: "28 October 2026, 05:00 PM",
      isStrict: true,
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
  ],
  events: [
    {
      id: "ev-adm-1",
      title: "Quarterly Building Fire Drill & Evacuation Practice",
      date: "14 October 2026, 02:00 PM",
      location: "Block 4 Exterior Assembly Area",
      sourceDocument: "office_lease_and_utilities_notice.pdf",
    },
  ],
  importantNotes: [
    "Late utility payments incur a 2.5% compounding fee after the 5-day grace period.",
    "Non-submission of the safety certificate results in commercial premises audit by municipal authorities.",
  ],
  processingDurationMs: 1150,
};

/**
 * Array of curated samples for quick-picker UI in Phase 3
 */
export const SAMPLE_DOCUMENTS: SampleDocumentItem[] = [
  {
    id: "sample-college",
    name: "college_circular_capstone_2026.pdf",
    categoryLabel: "Academic Notice",
    description: "Final year project submission deadlines, fee cutoff, and defense date.",
    sampleFile: {
      name: "college_circular_capstone_2026.pdf",
      sizeBytes: 245760,
      mimeType: "application/pdf",
    },
    result: collegeNoticeResult,
  },
  {
    id: "sample-symposium",
    name: "tech_symposium_call_for_papers.pdf",
    categoryLabel: "Event Circular",
    description: "Research paper submission guidelines, early registration, and keynote dates.",
    sampleFile: {
      name: "tech_symposium_call_for_papers.pdf",
      sizeBytes: 524288,
      mimeType: "application/pdf",
    },
    result: symposiumCircularResult,
  },
  {
    id: "sample-office",
    name: "office_lease_and_utilities_notice.pdf",
    categoryLabel: "Admin / Invoice",
    description: "Commercial utility bill due dates, safety compliance audit, and fire drill.",
    sampleFile: {
      name: "office_lease_and_utilities_notice.pdf",
      sizeBytes: 153600,
      mimeType: "application/pdf",
    },
    result: officeNoticeResult,
  },
];
