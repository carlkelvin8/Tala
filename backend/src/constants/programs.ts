import { NstpType } from "@prisma/client"

export type MandatoryCourse = {
  code: string
  name: string
}

// Fixed, read-only lists of degree programs that are mandatory per NSTP component.
export const MANDATORY_COURSES: Record<NstpType, MandatoryCourse[]> = {
  CWTS: [
    { code: "BSAIS", name: "Bachelor of Science in Aviation Information System" },
    { code: "BSAIT", name: "Bachelor of Science in Aviation Information Technology" },
    { code: "BSATM", name: "Bachelor of Science in Aviation Tourism Major in Travel Management" },
    { code: "BSSM", name: "Bachelor of Science in Supply Management with Specialization in Aviation Logistics" },
    { code: "BSAC", name: "Bachelor of Science in Aviation Communication Major in Flight Operations" },
  ],
  ROTC: [
    { code: "BSAT", name: "Bachelor of Science in Air Transportation" },
    { code: "BSAE", name: "Bachelor of Science in Aeronautical Engineering" },
    { code: "AMT/BSAMT", name: "Associate in Aviation Maintenance Technology / Bachelor of Science in Aviation Maintenance Technology" },
    { code: "AET/BSAET", name: "Associate in Aviation Electronics Technology / Bachelor of Science in Aviation Electronics Technology" },
    { code: "BSASM", name: "Bachelor of Science in Aviation Safety and Security Management" },
  ],
}