/** Build-time authored content; only the current locale is sent to a page. */
export interface ExampleCopy {
  contract: {
    title: string; parties: [string, string]; names: [string, string]; code: string;
    note: string; scope: [string, string]; headers: [string, string, string]; item: [string, string, string];
    payment: [string, string]; delivery: [string, string]; acceptance: [string, string];
    signature: string; date: string;
  };
  resume: {
    name: string; role: string; contact: string; profile: [string, string];
    experience: [string, string, string, string, string]; education: [string, string]; skills: [string, string];
  };
  report: { title: string; summary: [string, string]; results: [string, string, string, string, string, string, string]; next: [string, string] };
  academic: { title: string; author: string; abstract: string; keywords: string; sections: [string, string][] };
  letter: { subject: string; from: string; to: string; greeting: string; paragraphs: string[]; closing: string; signature: string };
}
