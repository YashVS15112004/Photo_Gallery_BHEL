// generate-docx-report.js
const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } = require('docx');
const fs = require('fs');

const reportTitle = 'Photo Gallery BHEL - Project Report';
const executiveSummary = `The Photo Gallery BHEL is a comprehensive web application designed for managing and displaying photo collections with advanced features including user authentication, album management, image processing, and administrative controls. The project follows a modern full-stack architecture with separate frontend and backend components.`;
const projectOverview = [
  ['Project Name', 'Photo Gallery BHEL'],
  ['Project Type', 'Full-Stack Web Application'],
  ['Technology Stack', 'Frontend: React 19.1.0 with TypeScript\nBackend: Node.js with Express.js\nDatabase: MongoDB with Mongoose ODM\nImage Processing: Sharp library for optimization\nUI Framework: Material-UI (MUI) v7.1.1\nAuthentication: JWT-based authentication\nFile Upload: Multer middleware\nBuild Tool: Vite']
];
const architectureOverview = [
  'System Architecture',
  'The application follows a three-tier architecture:',
  '1. Presentation Layer: React-based frontend applications',
  '2. Application Layer: Node.js/Express.js backend API',
  '3. Data Layer: MongoDB database',
  '',
  'Component Structure',
  '1. Main Frontend Application (/src)',
  '   Technology: React 19.1.0 + TypeScript + Vite',
  '   UI Framework: Material-UI with custom dark theme',
  '   Key Features: Photo gallery display, User authentication, Album browsing, Image upload functionality, Responsive design with animations',
  '2. Admin Portal (/admin-portal)',
  '   Technology: React 18.2.0 + TypeScript + Create React App',
  '   Purpose: Administrative interface for content management',
  '   Features: User management, Album management, System logs, Administrative controls',
  '3. Backend Server (/server)',
  '   Technology: Node.js + Express.js + MongoDB',
  '   API Endpoints: RESTful API for all operations',
  '   Features: User authentication and authorization, Image upload and processing, Album management, File storage and retrieval'
];

function addSectionTitle(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
  });
}
function addSubsectionTitle(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 100 },
  });
}
function addParagraph(text) {
  return new Paragraph({
    children: [new TextRun(text)],
    spacing: { after: 100 },
  });
}
function addBulletList(items) {
  return items.map(item => new Paragraph({ text: item, bullet: { level: 0 } }));
}
function addTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([key, value]) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(key)] }),
        new TableCell({ children: [new Paragraph(value)] }),
      ],
    })),
  });
}

const doc = new Document({
  sections: [
    {
      children: [
        addSectionTitle(reportTitle),
        addSubsectionTitle('Executive Summary'),
        addParagraph(executiveSummary),
        addSubsectionTitle('Project Overview'),
        addTable(projectOverview),
        addSubsectionTitle('Architecture Overview'),
        ...architectureOverview.map(addParagraph),
        // Add more sections as needed, following the same pattern
        addParagraph('For full details, see the project documentation.'),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('Photo_Gallery_BHEL_Project_Report.docx', buffer);
  console.log('DOCX report generated: Photo_Gallery_BHEL_Project_Report.docx');
}); 