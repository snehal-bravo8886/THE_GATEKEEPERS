import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleHelp, LoaderCircle, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import './scan.css';

type PermissionInput = {
  role: string;
  title: string;
  description: string;
  enabled: boolean;
  risk: string;
};

type SourceInput = { path: string; size: number; content: string };

type Finding = {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  location: string;
  evidence?: string;
  explanation: string;
  recommendation: string;
};

type Check = {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'info' | 'error';
  detail: string;
};

type ScanResult = {
  scanId: string;
  projectName: string;
  scenario: string;
  scannedAt: string;
  targetKind: 'website' | 'source';
  target: { originalUrl: string; finalUrl: string; statusCode: number } | null;
  source: { analyzedFiles: number } | null;
  summary: {
    findings: number;
    highOrCritical: number;
    score: number;
    severity: Record<string, number>;
    checksPassed: number;
    checksReviewed: number;
  };
  checks: Check[];
  findings: Finding[];
  limitations: string[];
};

type Props = {
  projectName: string;
  targetUrl: string;
  targetKind: 'website' | 'source';
  scenarioTitle: string;
  permissions: PermissionInput[];
  sourceFiles: SourceInput[];
};

const severityLabel: Record<Finding['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info'
};

function dateLabel(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ScanPanel({
  projectName,
  targetUrl,
  targetKind,
  scenarioTitle,
  permissions,
  sourceFiles
}: Props) {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  async function checkBackend() {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('Backend health check failed');
      const body = await response.json();
      setBackendOnline(body.ok === true);
    } catch {
      setBackendOnline(false);
    }
  }

  useEffect(() => {
    void checkBackend();
  }, []);

  async function runScan() {
    setError('');
    setScanning(true);
    setResult(null);
    try {
      const payload = {
        projectName,
        url: targetUrl,
        targetKind,
        scenario: scenarioTitle,
        permissions,
        sourceFiles: targetKind === 'source' ? sourceFiles : [],
        authorized
      };
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'The scan could not be completed.');
      setResult(body as ScanResult);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unexpected scanner error.');
      await checkBackend();
    } finally {
      setScanning(false);
    }
  }

  const canRun = backendOnline === true && authorized && !scanning &&
    (targetKind === 'website' ? Boolean(targetUrl.trim()) : sourceFiles.length > 0);

  return (
    <section className="card scan-panel">
      <div className="scan-panel-head">
        <div>
          <small>LIVE ANALYSIS · LOCAL SCAN ENGINE</small>
          <h2>Run a security check</h2>
          <p>
            {targetKind === 'website'
              ? 'Inspect the website response and common browser-security headers.'
              : 'Review your imported code for common access-control and business-logic risk patterns.'}
          </p>
        </div>
        <span className="scan-shield"><ShieldCheck size={22} /></span>
      </div>

      <div className="scan-engine-status">
        <span className={backendOnline ? 'scan-engine-dot online' : 'scan-engine-dot'} />
        <span>
          <b>{backendOnline === null ? 'Checking scan engine…' : backendOnline ? 'Scan engine connected' : 'Scan engine offline'}</b>
          <small>{backendOnline
            ? 'Your local backend is ready to analyse this project.'
            : 'Start the app with npm run dev so the backend and frontend run together.'}</small>
        </span>
        <button type="button" className="light scan-refresh" onClick={() => void checkBackend()} disabled={backendOnline === null}>
          <RefreshCw size={13} /> Check
        </button>
      </div>

      <div className="scan-scope">
        <span><b>Project</b><small>{projectName}</small></span>
        <span><b>Input</b><small>{targetKind === 'website' ? targetUrl : sourceFiles.length + ' imported source files'}</small></span>
        <span><b>Review pack</b><small>{scenarioTitle}</small></span>
      </div>

      {targetKind === 'source' && sourceFiles.length === 0 && (
        <div className="scan-inline-warning"><AlertTriangle size={15} /> No source files are currently loaded. Re-open the project and import its source files again.</div>
      )}

      <label className="scan-authorise">
        <input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} />
        <span>
          <b>I own this project or have explicit permission to assess it.</b>
          <small>This confirmation is required each time a scan is started.</small>
        </span>
      </label>

      <div className="scan-actions">
        <button type="button" className="blue scan-run" disabled={!canRun} onClick={() => void runScan()}>
          {scanning ? <LoaderCircle className="scan-spin" size={16} /> : <Play size={15} />}
          {scanning ? 'Analysing project…' : targetKind === 'website' ? 'Check website now' : 'Analyse source code now'}
        </button>
        <span>{targetKind === 'website' ? 'Bounded homepage check with limited redirects; no crawling or login attempts.' : 'Text-only analysis; your code is never executed.'}</span>
      </div>

      {error && <div className="scan-error"><AlertTriangle size={16} /> {error}</div>}

      {result && (
        <div className="scan-results">
          <div className="scan-results-title">
            <div>
              <small>SCAN COMPLETE · {dateLabel(result.scannedAt)}</small>
              <h3>Security review results</h3>
            </div>
            <span className={result.summary.findings ? 'scan-count has-findings' : 'scan-count'}>
              {result.summary.findings} finding{result.summary.findings === 1 ? '' : 's'}
            </span>
          </div>

          <div className="scan-metrics">
            <div><b>{result.summary.findings}</b><small>Total findings</small></div>
            <div><b>{result.summary.highOrCritical}</b><small>High / critical</small></div>
            <div><b>{result.summary.checksPassed}/{result.summary.checksReviewed}</b><small>Checks passed</small></div>
            <div><b>{result.summary.score}</b><small>Risk points*</small></div>
          </div>
          <p className="scan-score-note">*Risk points are a prioritisation aid, not a probability of being breached.</p>

          {result.target && (
            <div className="scan-target-response">
              <b>Website response</b>
              <span>HTTP {result.target.statusCode}</span>
              <small>{result.target.finalUrl}</small>
            </div>
          )}
          {result.source && (
            <div className="scan-target-response">
              <b>Source files reviewed</b>
              <span>{result.source.analyzedFiles}</span>
              <small>Files were inspected as text and were not executed.</small>
            </div>
          )}

          <div className="scan-check-list">
            <b className="scan-section-label">Checks performed</b>
            {result.checks.map(check => (
              <div className="scan-check" key={check.id}>
                <span className={'scan-check-icon ' + check.status}>
                  {check.status === 'pass' ? <CheckCircle2 size={15} /> : check.status === 'warn' || check.status === 'error' ? <AlertTriangle size={15} /> : <CircleHelp size={15} />}
                </span>
                <span><b>{check.title}</b><small>{check.detail}</small></span>
                <em className={'scan-status ' + check.status}>{check.status === 'pass' ? 'Passed' : check.status === 'warn' ? 'Review' : check.status === 'error' ? 'Error' : 'Info'}</em>
              </div>
            ))}
          </div>

          <div className="scan-findings">
            <b className="scan-section-label">Findings and recommendations</b>
            {result.findings.length === 0 ? (
              <div className="scan-no-findings"><CheckCircle2 size={19} /><span><b>No configured rule matched this scan.</b><small>This is not proof that the app is secure. Review the coverage notes below.</small></span></div>
            ) : result.findings.map((finding, index) => (
              <article className="scan-finding" key={finding.id + '-' + index}>
                <div className="scan-finding-heading">
                  <span className={'scan-severity ' + finding.severity}>{severityLabel[finding.severity]}</span>
                  <b>{finding.title}</b>
                </div>
                <small className="scan-finding-meta">{finding.category} · {finding.location}</small>
                <p>{finding.explanation}</p>
                {finding.evidence && <pre>{finding.evidence}</pre>}
                <div className="scan-recommendation"><b>Suggested fix</b><span>{finding.recommendation}</span></div>
              </article>
            ))}
          </div>

          <details className="scan-limitations">
            <summary>What this scan does and does not test</summary>
            <ul>{result.limitations.map(item => <li key={item}>{item}</li>)}</ul>
          </details>
        </div>
      )}
    </section>
  );
}
