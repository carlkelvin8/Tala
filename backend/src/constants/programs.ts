import { NstpType } from "@prisma/client"

export type MandatoryCourse = {
  code: string
  name: string
}

// Fixed, read-only lists of mandatory courses per NSTP program.
// These are placeholders — adjust the codes/names to match the actual curriculum.
export const MANDATORY_COURSES: Record<NstpType, MandatoryCourse[]> = {
  CWTS: [
    { code: "NSTP-101", name: "National Service Training Program Common Module (RA 9163 Orientation)" },
    { code: "CWTS-101", name: "Civic Welfare Training Service I" },
    { code: "CWTS-102", name: "Civic Welfare Training Service II" },
    { code: "LTS-101", name: "Literacy Training Service I" },
    { code: "LTS-102", name: "Literacy Training Service II" },
  ],
  ROTC: [
    { code: "NSTP-101", name: "National Service Training Program Common Module (RA 9163 Orientation)" },
    { code: "ROTC-101", name: "Reserved Officers' Training Corps I" },
    { code: "ROTC-102", name: "Reserved Officers' Training Corps II" },
    { code: "ROTC-201", name: "Leadership and Drill Training I" },
    { code: "ROTC-202", name: "Leadership and Drill Training II" },
  ],
}