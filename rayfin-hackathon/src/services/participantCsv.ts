import {
  buildHackathonResults,
  parseHonorableMentionIds,
  splitTeamMembers,
  type ResultMedal,
} from '@/services/hackathonResults';
import type { FinalProjectSubmissionRecord } from '@/types/finalProjectSubmission';
import type { JudgingEntryRecord } from '@/types/judging';
import {
  splitCommaSeparatedValues,
  type ProjectSubmissionRecord,
} from '@/types/projectSubmission';
import { strToU8, zipSync } from 'fflate';

export interface SubmittedParticipantCsvRow {
  firstName: string;
  lastName: string;
  email: string;
  recognition: ResultMedal | 'Honorable mention' | 'No';
}

function splitParticipantName(fullName: string): Pick<
  SubmittedParticipantCsvRow,
  'firstName' | 'lastName'
> {
  const [firstName = '', ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(' '),
  };
}

function getRegistrationByOwner(
  registrations: ProjectSubmissionRecord[]
): Map<string, ProjectSubmissionRecord> {
  const registrationsByOwner = new Map<string, ProjectSubmissionRecord>();

  for (const registration of registrations) {
    if (!registrationsByOwner.has(registration.ownerUserId)) {
      registrationsByOwner.set(registration.ownerUserId, registration);
    }
  }

  return registrationsByOwner;
}

export function buildSubmittedParticipantCsvRows(
  registrations: ProjectSubmissionRecord[],
  submissions: FinalProjectSubmissionRecord[],
  entries: JudgingEntryRecord[],
  criterionIds: string[],
  honorableMentionSubmissionIds: string
): SubmittedParticipantCsvRow[] {
  const registrationsByOwner = getRegistrationByOwner(registrations);
  const medalsBySubmission = new Map(
    buildHackathonResults(registrations, submissions, entries, criterionIds).ranked
      .filter((result) => result.medal !== null)
      .map((result) => [result.submissionId, result.medal as ResultMedal])
  );
  const honorableMentionIds = new Set(
    parseHonorableMentionIds(honorableMentionSubmissionIds)
  );

  return submissions.flatMap((submission) => {
    const registration = registrationsByOwner.get(submission.ownerUserId);
    const submittedNames = splitTeamMembers(submission.teamMembers);
    const registeredNames = splitCommaSeparatedValues(registration?.teamMembers);
    const emails = registration
      ? splitCommaSeparatedValues(registration.teamEmails)
      : [];
    const participantCount = Math.max(
      submittedNames.length,
      registeredNames.length,
      emails.length,
      1
    );
    const medal = medalsBySubmission.get(submission.id);
    const recognition = medal
      ? medal
      : honorableMentionIds.has(submission.id)
        ? 'Honorable mention'
        : 'No';

    return Array.from({ length: participantCount }, (_, index) => {
      const fullName =
        submittedNames[index] ??
        registeredNames[index] ??
        (index === 0 ? submission.submitterName : '');

      return {
        ...splitParticipantName(fullName),
        email:
          emails[index] ??
          (index === 0 ? submission.ownerEmail : ''),
        recognition,
      };
    });
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getSpreadsheetSafeValue(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function getColumnName(index: number): string {
  let columnName = '';
  let remaining = index + 1;

  while (remaining > 0) {
    const characterIndex = (remaining - 1) % 26;
    columnName = String.fromCharCode(65 + characterIndex) + columnName;
    remaining = Math.floor((remaining - 1) / 26);
  }

  return columnName;
}

function createWorksheetXml(rows: string[][]): string {
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const cellReference = `${getColumnName(columnIndex)}${rowIndex + 1}`;
          const safeValue = escapeXml(getSpreadsheetSafeValue(value));
          return `<c r="${cellReference}" t="inlineStr"><is><t xml:space="preserve">${safeValue}</t></is></c>`;
        })
        .join('');

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

export function buildSubmittedParticipantWorkbook(
  rows: SubmittedParticipantCsvRow[]
): Uint8Array {
  const participantRows = [
    ['First Name', 'Last Name', 'Email', 'Recognition'],
    ...rows.map((row) => [
      row.firstName,
      row.lastName,
      row.email,
      row.recognition,
    ]),
  ];
  const winnerRows = [
    ['First Name', 'Last Name', 'Email'],
    ...rows
      .filter((row) =>
        row.recognition === 'Gold' ||
        row.recognition === 'Silver' ||
        row.recognition === 'Bronze'
      )
      .map((row) => [row.firstName, row.lastName, row.email]),
  ];

  return zipSync({
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Participants" sheetId="1" r:id="rId1"/>
    <sheet name="Winners" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(createWorksheetXml(participantRows)),
    'xl/worksheets/sheet2.xml': strToU8(createWorksheetXml(winnerRows)),
  });
}

export function downloadSubmittedParticipantWorkbook(
  rows: SubmittedParticipantCsvRow[],
  filename = 'submitted-project-participants.xlsx'
) {
  const workbook = buildSubmittedParticipantWorkbook(rows);
  const workbookBuffer = new ArrayBuffer(workbook.byteLength);
  new Uint8Array(workbookBuffer).set(workbook);
  const blob = new Blob([workbookBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
