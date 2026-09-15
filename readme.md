# AHG Pay • Merchant Document Upload Portal (Demo)

A modern, responsive underwriting and merchant document upload portal designed for high-risk merchant onboarding, compliance verification, and encrypted document submissions.

## Features

- **Multi-Industry Workflows**: Tailored document requirement workflows for Peptide Brands, Hemp/CBD, and General High-Risk merchants.
- **Interactive Compliance Status**: Real-time underwriting progress breakdown with interactive visualization.
- **Merchant Onboarding Pipeline**: Step-by-step onboarding pipeline stepper tracking application stages from submission to account live status.
- **Encrypted Express Document Vault**: Secure multi-format drag-and-drop file upload interface (PDF, Word, Excel, CSV, PNG, JPG).
- **Categorized Document Tables**: Direct item-by-item uploads, status badges (Required, Under Review, Verified), instant replacements, and external form integration.
- **Responsive & Modern UI**: Built with a sleek, high-contrast aesthetic and clean micro-interactions.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, SCSS
- **Charts & Visualizations**: Recharts
- **Icons**: React Icons (Feather)
- **Notifications**: React Toastify
- **Storage/Backend Integration**: AWS S3 Pre-signed URLs & REST API

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:the-value-crew/ahg-doc-upload-portal-demo.git
   cd ahg-doc-upload-portal-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_KEY` | API authentication key for underwriting services |
| `VITE_API_URL` | Base endpoint URL for AWS API Gateway / backend service |
| `VITE_GENERIC` | Generic merchant identifier or default portal parameters |

## License

MIT License
