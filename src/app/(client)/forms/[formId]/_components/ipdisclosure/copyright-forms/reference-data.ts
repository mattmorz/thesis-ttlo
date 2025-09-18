// Types for the reference data
export interface ClassificationItem {
  class: string;
  type: string;
  deposit: string;
  recordation: string;
  additional: string;
}

export interface FeeItem {
  type: string;
  small: string;
  big: string;
}

export const legalNotice =
  "* Inclusive of 1% Legal Research Fee for transactions with fees P1,000 and above or P10.00 Legal Research Fee for transactions with fees P100.00-999.00 (inclusive) + Documentary Stamp Tax (DST) P15";

// Classification data with updated headers to match the image
export const classificationData: ClassificationItem[] = [
  {
    class: "A",
    type: "Books, E-Books, Audio books, pamphlets, comics, novels, articles",
    deposit:
      "Copy of Work for Deposit and Registration (For Copyright Registrations Only)",
    recordation:
      "Requirements for Recordation of Copyright Transfer, Assignment, Exclusive License and Mortgage Agreements, Resale Rights, or Foreign Submissions, or Lost/Missing Certificate",
    additional:
      "Additional Requirements for Institutional or IKSP or TTA Related Registration",
  },
  {
    class: "B",
    type: "Periodicals, journals, diaries, newspaper, magazine, e-magazines",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in storage medium",
    recordation:
      "Three (3) original copies of filled-out and signed BCRR Transaction form.",
    additional: "",
  },
  {
    class: "C",
    type: "Lectures, sermons, addresses, speeches, dissertations prepared for delivery",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in storage medium",
    recordation: "1 Government ID for the applicant",
    additional: "",
  },
  {
    class: "D",
    type: "Letters, circulars, encyclicals, emails, and other electronic messages",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in storage medium",
    recordation: "Special Power of Attorney (For Agents)",
    additional: "",
  },
  {
    class: "E",
    type: "Plays, operas, choreographies, pantomimes, magic routines, and other novelty acts",
    deposit:
      "Two (2) original copies of the music sheet or an electronic copy submitted online or in storage medium",
    recordation:
      "Four (4) Original Copies of the Deed/Contract of Assignment/Transfer OR Mortgage/Exclusive License Agreement",
    additional: "Board Resolution OR Secretary's Certificate",
  },
  {
    class: "F",
    type: "Musical compositions with or without lyrics",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation:
      "For Heirs (Children) Birth certificate of heirs and death certificate of parent author/creator",
    additional:
      "For IKSP derived works, Certification from National Commission on Indigenous People OR Certification(s) of ownership of IKSP from National Commission on Indigenous People (NCIP) OR Other Certifying Authority OR Indigenous Peoples recognized or accredited by NCIP",
  },
  {
    class: "G",
    type: "Drawings, paintings, architectural works, sculpture, engraving, prints, lithography, or other works of art, models, or designs for work of art",
    deposit:
      "Two (2) SR photographs or an electronic copy submitted online or in a storage medium",
    recordation:
      "For Heir (Spouse) Marriage Certificate of the heir spouse and author/creator",
    additional: "",
  },
  {
    class: "H",
    type: "Ornamental designs or models for articles of manufacturer and industrial objects, and other works of alphabet art",
    deposit:
      "Two (2) SR photographs or an electronic copy submitted online or in a storage medium, with a technical description of the design",
    recordation:
      "Alien Certificate of Registration ID for Non-Resident Alien Applicant",
    additional:
      "For works by a RDI under by the Technology Transfer Act, Memorandum of Agreement OR Contract from Funding Agency",
  },
  {
    class: "I",
    type: "Illustrations, maps, plans, sketches, charts, and three-dimensional works relative to geography, topography, architecture, or science",
    deposit:
      "Two (2) SR photographs or an electronic copy submitted online or in a storage medium",
    recordation:
      "For Foreign Submissions, Special Power of Attorney for designated or assigned agent",
    additional:
      "Four (4) Original Copies of the Deed or Contract of Assignment or Transfer to employer claiming copyright ownership over their employee's work OR Employment Contract OR Job Description signed by employee-author/creator clearly indicating that the work is part of his/her regular duties",
  },
  {
    class: "J",
    type: "Drawings or plastic works of a scientific and technical character",
    deposit:
      "Two (2) SR photographs or an electronic copy submitted online or in a storage medium",
    recordation:
      "Three (3) Original Hard Copies of Affidavit of Loss for lost or missing Certificate of Copyright Registration applications",
    additional: "",
  },
  {
    class: "K",
    type: "Photographic works including works produced by a process analogous to photography, lantern slides",
    deposit:
      "Two (2) SR photographs or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
  {
    class: "L",
    type: "Audiovisual works and cinematographic works and works produced by a process analogous to cinematography or any process for making audio visual recordings",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
  {
    class: "M",
    type: "Pictorial illustrations and advertisements",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
  {
    class: "N",
    type: "Computer programs and games",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "Source Code (for Computer Programs and Games)",
    additional: "",
  },
  {
    class: "O",
    type: "Other literary, scholarly, scientific, and artistic works, including reports, studies, research, theses, and other academic papers, examinations, online courses, presentations",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
  {
    class: "P",
    type: "Sound recordings",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
  {
    class: "Q",
    type: "Broadcast recordings",
    deposit:
      "Two (2) original copies or an electronic copy submitted online or in a storage medium",
    recordation: "",
    additional: "",
  },
];

// Fee schedule data
export const feeScheduleData: FeeItem[] = [
  {
    type: "Copyright Deposit/Recordation (NCR)",
    small: "450",
    big: "625",
  },
  {
    type: "Copyright Deposit/Recordation (Region)",
    small: "550",
    big: "750",
  },
  {
    type: "Copyright Deposit/Recordation (Bulk), per certificate + NLP Trust-in-Fund",
    small: "200",
    big: "200",
  },
  {
    type: "Amendment/Correction – Certificate (NCR)",
    small: "300",
    big: "625",
  },
  {
    type: "Amendment/ Correction – Certificate (Region)",
    small: "300",
    big: "750",
  },
  {
    type: "Amendment/Correction – Certificate (Bulk)",
    small: "100",
    big: "200",
  },
  {
    type: "Dispute Resolution (Author's Rights)",
    small: "2000",
    big: "6500",
  },
  {
    type: "Additional Copies of Original Certificate of Copyright Registration (under IPOPHL general fees-Certification)",
    small: "370",
    big: "370",
  },
  {
    type: "Certified True Copy of Certificate",
    small: "Free, Courier fee to be paid by applicant",
    big: "500",
  },
  {
    type: "Other Certification Requests (under IPOPHL general fees)",
    small: "370",
    big: "370",
  },
  {
    type: "Computer Printout, per printed sheet (under IPOPHL general fees)",
    small: "20",
    big: "20",
  },
  {
    type: "Reconstitution of records/ lost/misplaced certificate of copyright registration (under IPOPHL general fees)",
    small: "500",
    big: "900",
  },
];
