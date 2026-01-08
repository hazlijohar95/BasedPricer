import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  decodeReport,
  decodeReportCompressed,
  retrieveReport,
  isValidReportData
} from '../utils/reportEncoder';
import { ReportShell } from './ReportShell';
import { AccountantReport } from './reports/AccountantReport';
import { InvestorReport } from './reports/InvestorReport';
import { EngineerReport } from './reports/EngineerReport';
import { MarketerReport } from './reports/MarketerReport';

type StakeholderType = 'accountant' | 'investor' | 'engineer' | 'marketer';

const validStakeholders: StakeholderType[] = ['accountant', 'investor', 'engineer', 'marketer'];

export function ReportPage() {
  // Get URL params - handles multiple route patterns
  const { id, data, stakeholder } = useParams<{
    id?: string;      // Short link: /r/{id}/{stakeholder}
    data?: string;    // Legacy: /report/{data}/{stakeholder}
    stakeholder: string;
  }>();
  const [searchParams] = useSearchParams();
  const compressedData = searchParams.get('d'); // Portable: /report/{stakeholder}?d={compressed}

  // Decode and validate report data based on URL format
  const { reportData, encodedData } = useMemo(() => {
    // Format 1: Short link with localStorage (/r/{id}/{stakeholder})
    if (id) {
      const stored = retrieveReport(id);
      if (stored && isValidReportData(stored)) {
        return { reportData: stored, encodedData: id };
      }
    }

    // Format 2: Portable link with compressed data in query string (/report/{stakeholder}?d={compressed})
    if (compressedData) {
      try {
        const decoded = decodeReportCompressed(compressedData);
        if (isValidReportData(decoded)) {
          return { reportData: decoded, encodedData: compressedData };
        }
      } catch (e) {
        console.error('Failed to decode compressed data:', e);
      }
    }

    // Format 3: Legacy format with data in path (/report/{data}/{stakeholder})
    if (data) {
      try {
        const decoded = decodeReport(data);
        if (isValidReportData(decoded)) {
          return { reportData: decoded, encodedData: data };
        }
      } catch (e) {
        console.error('Failed to decode legacy data:', e);
      }
    }

    return { reportData: null, encodedData: '' };
  }, [id, data, compressedData]);

  // Validate stakeholder
  const validStakeholder = stakeholder && validStakeholders.includes(stakeholder as StakeholderType)
    ? (stakeholder as StakeholderType)
    : null;

  // Handle invalid data or stakeholder
  if (!reportData || !validStakeholder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Report Link</h1>
          <p className="text-gray-500 mb-4">
            {id ? (
              <>This report link has expired or was created on a different device. Short links only work on the device where they were created.</>
            ) : (
              <>This report link appears to be invalid or corrupted. Please request a new link from the report creator.</>
            )}
          </p>
          <div className="space-y-2">
            <a
              href="/"
              className="inline-block px-4 py-2 bg-[#253ff6] text-white rounded hover:bg-[#1a2eb8] transition-colors"
            >
              Go to Homepage
            </a>
            {id && (
              <p className="text-xs text-gray-400 mt-4">
                Tip: Ask for a "Portable Link" which works across all devices.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate report
  const renderReport = () => {
    switch (validStakeholder) {
      case 'accountant':
        return <AccountantReport reportData={reportData} />;
      case 'investor':
        return <InvestorReport reportData={reportData} />;
      case 'engineer':
        return <EngineerReport reportData={reportData} />;
      case 'marketer':
        return <MarketerReport reportData={reportData} />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <ReportShell reportData={reportData} stakeholder={validStakeholder} encodedData={encodedData}>
      {renderReport()}
    </ReportShell>
  );
}
