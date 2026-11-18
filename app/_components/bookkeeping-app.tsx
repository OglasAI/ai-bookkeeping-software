"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  CloudUpload,
  DatabaseZap,
  Download,
  FileCheck2,
  FileSearch,
  FileSpreadsheet,
  FileText,
  History,
  Inbox,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquareText,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Scale,
  ShieldCheck,
  Sparkles,
  Stamp,
  WandSparkles,
  X,
  XCircle,
} from "lucide-react";
import { clientFinancials, clients, ledgerOptions } from "@/lib/fixtures";
import { extractUploadedFile, isBalanced } from "@/lib/adapters";
import { downloadDocumentPdf, downloadFinancialStatementPdf } from "@/lib/pdf-export";
import { classifyUploadedDocument } from "@/lib/upload-classification";
import type { BookkeepingDocument, DocumentStatus, FinancialAccount, View } from "@/lib/types";
import { DemoProvider, useDemo } from "./demo-store";
import { getDocumentFile, storeDocumentFile } from "@/lib/file-store";

const money = (value: number) => new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  needs_review: "Needs review",
  approved: "Approved",
  rejected: "Rejected",
  demo_exported: "Demo exported",
  demo_synced: "Demo synced",
  error: "Error",
};

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "inbox", label: "Document inbox", icon: Inbox },
  { id: "financials", label: "Financial statements", icon: Scale },
  { id: "approvals", label: "Approval queue", icon: Stamp },
  { id: "integrations", label: "Integrations", icon: DatabaseZap },
  { id: "learning", label: "Learning insights", icon: Lightbulb },
];

function StatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`status-badge status-${status}`}><CircleDot size={12} />{statusLabels[status]}</span>;
}

type ClientDocumentStage = "received" | "review" | "approved" | "sent" | "attention";

const clientStageCopy: Record<ClientDocumentStage, { label: string; detail: string }> = {
  received: { label: "Received", detail: "Your document was uploaded successfully." },
  review: { label: "With your accountant", detail: "Your accountant is checking the document." },
  approved: { label: "Approved", detail: "Your accountant has approved the bookkeeping entry." },
  sent: { label: "Sent to accounts", detail: "The approved entry was sent to your accounting records." },
  attention: { label: "Action needed", detail: "Your accountant needs a clearer or corrected document." },
};

function clientStageFor(status: DocumentStatus): ClientDocumentStage {
  if (["uploaded", "processing"].includes(status)) return "received";
  if (status === "needs_review") return "review";
  if (status === "approved") return "approved";
  if (["demo_exported", "demo_synced"].includes(status)) return "sent";
  return "attention";
}

function ClientStatusBadge({ status }: { status: DocumentStatus }) {
  const stage = clientStageFor(status);
  return <span className={`client-status client-status-${stage}`}><CircleDot size={12} />{clientStageCopy[stage].label}</span>;
}

function ClientMark({ clientId, compact = false }: { clientId: string; compact?: boolean }) {
  const client = clients.find((item) => item.id === clientId)!;
  return (
    <span className="client-mark">
      <span className="client-initials" style={{ background: client.color }}>{client.shortName}</span>
      {!compact && <span><strong>{client.name}</strong><small>{client.integration}</small></span>}
    </span>
  );
}

function DemoTag() {
  return <span className="demo-tag"><Sparkles size={12} /> Demo / Simulated</span>;
}

type SummaryItem = { label: string; value: string | number; icon: typeof Inbox; tone: "amber" | "coral" | "green" | "blue" };

function SummaryBoxes({ items }: { items: SummaryItem[] }) {
  return (
    <div className="summary-boxes">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={`summary-box tone-${tone}`}>
          <span className={`summary-icon ${tone}`}><Icon size={18} /></span>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ClientDocumentJourney({ documents }: { documents: BookkeepingDocument[] }) {
  const stages: { id: ClientDocumentStage; icon: typeof CloudUpload }[] = [
    { id: "received", icon: CloudUpload },
    { id: "review", icon: FileSearch },
    { id: "approved", icon: BadgeCheck },
    { id: "sent", icon: Send },
  ];
  return (
    <section className="client-journey" aria-labelledby="client-journey-title">
      <div className="client-journey-heading">
        <div><h2 id="client-journey-title">What happens after you upload?</h2><p>You send the document once. Your accountant handles every bookkeeping decision.</p></div>
        <span><ShieldCheck size={16} /> No accounting knowledge needed</span>
      </div>
      <ol>
        {stages.map(({ id, icon: Icon }, index) => {
          const copy = clientStageCopy[id];
          const count = documents.filter((document) => clientStageFor(document.status) === id).length;
          return <li key={id}><span className="journey-icon"><Icon size={18} /></span><div><small>Step {index + 1}</small><strong>{copy.label}</strong><p>{copy.detail}</p></div><b aria-label={`${count} documents`}>{count}</b></li>;
        })}
      </ol>
    </section>
  );
}

const postedStatusList: DocumentStatus[] = ["approved", "demo_exported", "demo_synced"];

function App() {
  const demo = useDemo();
  const [view, setView] = useState<View>("overview");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const currentView = demo.role === "Client" ? "inbox" : view;

  const activeDocument = demo.documents.find((document) => document.id === activeDocumentId);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };
  const navigate = (next: View) => {
    if (next === "financials" && demo.selectedClientId === "all") demo.setSelectedClientId("c1");
    setView(next);
    setActiveDocumentId(null);
    setMenuOpen(false);
  };
  const openDocument = (id: string) => {
    setActiveDocumentId(id);
    setMenuOpen(false);
  };

  const visibleDocuments = demo.documents.filter((document) =>
    demo.selectedClientId === "all" || document.clientId === demo.selectedClientId);
  const pendingCount = visibleDocuments.filter((document) => document.status === "needs_review").length;
  const nextReviewDocumentId = activeDocument ? (() => {
    const currentIndex = visibleDocuments.findIndex((document) => document.id === activeDocument.id);
    const nextDocument = visibleDocuments.slice(currentIndex + 1).find((document) => document.status === "needs_review")
      ?? visibleDocuments.slice(0, currentIndex).find((document) => document.status === "needs_review");
    return nextDocument?.id ?? null;
  })() : null;

  return (
    <div className="app-frame">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/oglas-logo.png.png" alt="Oglas AI" className="brand-logo" />
          <span><strong>Ledgerly</strong><small>Review desk</small></span>
        </div>
        <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        <nav aria-label="Main navigation">
          {navItems.filter((item) => demo.role !== "Client" || item.id === "inbox").map((item) => {
            const Icon = item.icon;
            const count = item.id === "approvals" ? pendingCount : undefined;
            return (
              <button key={item.id} aria-current={currentView === item.id && !activeDocument ? "page" : undefined} className={currentView === item.id && !activeDocument ? "active" : ""} onClick={() => navigate(item.id)}>
                <Icon size={18} /><span>{demo.role === "Client" && item.id === "inbox" ? "My documents" : item.label}</span>{count !== undefined && <em>{count}</em>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <DemoTag />
          <p>Synthetic data only. No entries are posted to live accounting systems.</p>
          <button onClick={() => { demo.reset(); navigate("overview"); showToast("Demo restored to its original state."); }}><RotateCcw size={15} /> Reset demo</button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="scope-switcher">
            <span>Workspace</span>
            <label>
              <Building2 size={16} />
              <select value={demo.selectedClientId} disabled={demo.role === "Client"} onChange={(event) => demo.setSelectedClientId(event.target.value)}>
                {demo.role !== "Client" && <option value="all">All firm clients</option>}
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          <div className="top-actions">
            <label className="role-switcher">
              <span>Viewing as</span>
              <select value={demo.role} onChange={(event) => { const role = event.target.value as typeof demo.role; demo.setRole(role); if (role === "Client") navigate("inbox"); }}>
                <option>Firm Admin</option><option>Accountant</option><option>Client</option>
              </select>
            </label>
            <span className="avatar">AK</span>
          </div>
        </header>

        <main className="workspace">
          {activeDocument ? (
            <ReviewScreen
              key={activeDocument.id}
              document={activeDocument}
              nextReviewDocumentId={nextReviewDocumentId}
              onBack={() => setActiveDocumentId(null)}
              onNext={(id) => setActiveDocumentId(id)}
              notify={showToast}
            />
          ) : currentView === "overview" ? (
            <Overview documents={visibleDocuments} openDocument={openDocument} navigate={navigate} />
          ) : currentView === "clients" ? (
            <ClientsScreen openClient={(id) => { demo.setSelectedClientId(id); navigate("inbox"); }} />
          ) : currentView === "inbox" ? (
            <InboxScreen documents={visibleDocuments} openDocument={openDocument} notify={showToast} />
          ) : currentView === "approvals" ? (
            <ApprovalsScreen documents={visibleDocuments} openDocument={openDocument} />
          ) : currentView === "integrations" ? (
            <IntegrationsScreen notify={showToast} />
          ) : currentView === "financials" ? (
            <FinancialStatementsScreen openDocument={openDocument} />
          ) : (
            <LearningScreen openDocument={openDocument} />
          )}
        </main>
      </div>
      {menuOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      {toast && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function PageHeading({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

function Overview({ documents, openDocument, navigate }: { documents: BookkeepingDocument[]; openDocument: (id: string) => void; navigate: (view: View) => void }) {
  const pending = documents.filter((document) => document.status === "needs_review");
  const approved = documents.filter((document) => postedStatusList.includes(document.status));
  const processing = documents.filter((document) => ["uploaded", "processing"].includes(document.status));
  const volume = documents.reduce((sum, document) => sum + document.fields.total, 0);
  return (
    <>
      <PageHeading
        title="Good morning, Aisha. The review desk is ready."
        description="Every figure below is synthetic and prepared for the client demonstration."
        actions={<><DemoTag /><button className="button secondary" onClick={() => navigate("inbox")}><Inbox size={16} /> Open inbox</button></>}
      />
      <section className="desk-grid">
        <div className="work-ledger">
          <div className="section-title"><div><h2>Today’s work ledger</h2><p>Exceptions rise to the top; routine items stay visible.</p></div><span>{pending.length} awaiting judgement</span></div>
          <div className="ledger-flow">
            <div className="flow-stage"><span className="flow-icon amber"><CloudUpload size={19} /></span><strong>{processing.length}</strong><small>Arriving</small></div>
            <ArrowRight className="flow-arrow" size={18} />
            <div className="flow-stage"><span className="flow-icon coral"><FileSearch size={19} /></span><strong>{pending.length}</strong><small>Needs review</small></div>
            <ArrowRight className="flow-arrow" size={18} />
            <div className="flow-stage"><span className="flow-icon green"><BadgeCheck size={19} /></span><strong>{approved.length}</strong><small>Approved</small></div>
            <ArrowRight className="flow-arrow" size={18} />
            <div className="flow-stage"><span className="flow-icon blue"><Send size={19} /></span><strong>{documents.filter((document) => ["demo_exported", "demo_synced"].includes(document.status)).length}</strong><small>Handed off</small></div>
          </div>
          <div className="ledger-list">
            {pending.slice(0, 4).map((document) => <DocumentRow key={document.id} document={document} onOpen={() => openDocument(document.id)} />)}
            {pending.length === 0 && <EmptyState icon={FileCheck2} title="Review queue cleared" text="New documents will appear here when they need an accountant." />}
          </div>
          <button className="text-link" onClick={() => navigate("approvals")}>View the full approval queue <ArrowRight size={15} /></button>
        </div>
        <aside className="desk-note">
          <span className="pin" />
          <p className="note-date">Firm pulse · November</p>
          <h2>272 documents are expected across these three demo clients.</h2>
          <dl>
            <div><dt>Illustrative hours saved</dt><dd>24.5</dd></div>
            <div><dt>Documents in this demo</dt><dd>{documents.length}</dd></div>
            <div><dt>Captured value</dt><dd>AED {money(volume)}</dd></div>
          </dl>
          <p className="fine-print">Time savings are illustrative, based on five minutes of manual entry per document. They are not measured customer results.</p>
        </aside>
      </section>
      <section className="activity-strip">
        <div className="section-title"><div><h2>Recent control activity</h2><p>A compact audit trail across client workspaces.</p></div></div>
        {documents.slice(0, 5).map((document) => (
          <button key={document.id} onClick={() => openDocument(document.id)}>
            <ClientMark clientId={document.clientId} compact />
            <span><strong>{document.audit[0]?.action}</strong><small>{document.fields.supplier} · {document.receivedAt}</small></span>
            <StatusBadge status={document.status} />
          </button>
        ))}
      </section>
    </>
  );
}

function DocumentRow({ document, onOpen }: { document: BookkeepingDocument; onOpen: () => void }) {
  const client = clients.find((item) => item.id === document.clientId)!;
  return (
    <button className="document-row" onClick={onOpen}>
      <span className="file-tile"><FileText size={18} /><small>{document.fileType}</small></span>
      <span className="document-main"><strong>{document.fields.supplier}</strong><small>{client.name} · {document.fields.invoiceNumber}</small></span>
      {document.warnings.length > 0 && <span className="warning-count"><AlertTriangle size={14} />{document.warnings.length}</span>}
      <span className="amount"><strong>AED {money(document.fields.total)}</strong><small>{document.fields.confidence}% extraction confidence</small></span>
      <ArrowRight className="row-arrow" size={17} />
    </button>
  );
}

function ClientsScreen({ openClient }: { openClient: (id: string) => void }) {
  const { documents } = useDemo();
  return (
    <>
      <PageHeading title="Client workspaces" description="Each workspace keeps documents, rules, approvals, and integration state strictly scoped." actions={<DemoTag />} />
      <SummaryBoxes items={[
        { label: "Client workspaces", value: clients.length, icon: Building2, tone: "blue" },
        { label: "Documents", value: documents.length, icon: FileText, tone: "amber" },
        { label: "Needs review", value: documents.filter((d) => d.status === "needs_review").length, icon: FileSearch, tone: "coral" },
        { label: "Approved", value: documents.filter((d) => postedStatusList.includes(d.status)).length, icon: BadgeCheck, tone: "green" },
      ]} />
      <div className="client-register">
        <div className="register-head"><span>Client</span><span>Current workload</span><span>Accounting destination</span><span>Last activity</span><span /></div>
        {clients.map((client) => {
          const clientDocs = documents.filter((document) => document.clientId === client.id);
          const pending = clientDocs.filter((document) => document.status === "needs_review").length;
          return (
            <button key={client.id} onClick={() => openClient(client.id)}>
              <ClientMark clientId={client.id} />
              <span className="workload"><strong>{pending} reviews</strong><small>{clientDocs.length} demo documents</small></span>
              <span className="integration-name"><Landmark size={16} />{client.integration}</span>
              <span>{client.lastActivity}</span>
              <ArrowRight size={17} />
            </button>
          );
        })}
      </div>
      <div className="isolation-note"><ShieldCheck size={22} /><div><strong>Workspace isolation is part of the prototype model.</strong><p>Switching clients filters documents, supplier rules, approvals, and exports by client ID. Production authorization remains out of scope.</p></div></div>
    </>
  );
}

function InboxScreen({ documents, openDocument, notify }: { documents: BookkeepingDocument[]; openDocument: (id: string) => void; notify: (message: string) => void }) {
  const demo = useDemo();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadClientId, setUploadClientId] = useState(demo.selectedClientId === "all" ? "c1" : demo.selectedClientId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const isClient = demo.role === "Client";
  const classification = selectedFile ? classifyUploadedDocument(selectedFile.name) : null;
  const filtered = documents.filter((document) =>
    (status === "all" || (isClient ? clientStageFor(document.status) === status : document.status === status)) &&
    `${document.fields.supplier} ${document.fields.invoiceNumber} ${document.fileName}`.toLowerCase().includes(search.toLowerCase()));
  const openUpload = () => {
    setUploadClientId(demo.selectedClientId === "all" ? "c1" : demo.selectedClientId);
    setSelectedFile(null);
    setUploadOpen(true);
  };
  const submitUpload = async () => {
    if (!selectedFile) return;
    if (!ACCEPTED_UPLOAD_TYPES.includes(selectedFile.type) || selectedFile.size > MAX_UPLOAD_FILE_SIZE) {
      setUploadError("Choose a PDF, JPG, or PNG file no larger than 10 MB.");
      return;
    }
    setExtracting(true);
    setProgress("Trying AI extraction…");
    const extraction = await extractUploadedFile(selectedFile, ledgerOptions);
    if (!isClient) notify(extraction.source === "ai" ? "AI extraction used. Check every field before approving." : "Demo extraction used because live AI was unavailable.");
    const id = demo.simulateUpload({
      clientId: uploadClientId,
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      fileSize: selectedFile.size,
      ...extraction,
    });
    await storeDocumentFile(id, selectedFile);
    setExtracting(false);
    setProgress("");
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadError("");
    if (isClient) notify("Document uploaded successfully. Your accountant will review it next.");
    if (demo.role !== "Client") window.setTimeout(() => openDocument(id), 250);
  };
  return (
    <>
      <PageHeading title={isClient ? "My documents" : "Document inbox"} description={isClient ? "Upload receipts, bills, invoices, statements or spreadsheets. Your accountant will check and process them for you." : "A single intake point for portal, email, shared-folder, and WhatsApp-imported records."} actions={!isClient ? <DemoTag /> : undefined} />
      {!isClient && <SummaryBoxes items={[
        { label: "Arriving", value: documents.filter((d) => ["uploaded", "processing"].includes(d.status)).length, icon: CloudUpload, tone: "amber" },
        { label: "Needs review", value: documents.filter((d) => d.status === "needs_review").length, icon: FileSearch, tone: "coral" },
        { label: "Approved", value: documents.filter((d) => d.status === "approved").length, icon: BadgeCheck, tone: "green" },
        { label: "Handed off", value: documents.filter((d) => ["demo_exported", "demo_synced"].includes(d.status)).length, icon: Send, tone: "blue" },
      ]} />}
      {isClient && <section className="upload-band client-upload-band">
        <div className="upload-illustration"><CloudUpload size={28} /><span><i /><i /><i /></span></div>
        <div><h2>Send a document to your accountant</h2><p>Choose the file and send it. You do not need to select an expense type, category or ledger.</p></div>
        <button className="button primary" onClick={openUpload}><CloudUpload size={16} /> Choose document</button>
      </section>}
      {isClient && <ClientDocumentJourney documents={documents} />}
      <div className="table-tools">
        <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isClient ? "Search your documents" : "Search supplier, invoice, or file"} /></label>
        <label className="filter-select"><Settings2 size={16} /><select aria-label="Filter documents by status" value={status} onChange={(event) => setStatus(event.target.value)}>{isClient ? <><option value="all">All documents</option><option value="received">Received</option><option value="review">With your accountant</option><option value="approved">Approved</option><option value="sent">Sent to accounts</option><option value="attention">Action needed</option></> : <><option value="all">All statuses</option><option value="needs_review">Needs review</option><option value="approved">Approved</option><option value="uploaded">Uploaded</option><option value="processing">Processing</option><option value="rejected">Rejected</option></>}</select><ChevronDown size={14} /></label>
        <span className="result-count">{filtered.length} {isClient ? "documents" : "records"}</span>
      </div>
      <div className={`document-table ${isClient ? "client-document-table" : ""}`}>
        <div className="document-table-head">{isClient ? <><span>Document</span><span>Uploaded</span><span>Current status</span><span>Amount</span></> : <><span>Document</span><span>Client</span><span>Received</span><span>Status</span><span>Value</span><span /></>}</div>
        {filtered.map((document) => {
          const client = clients.find((item) => item.id === document.clientId)!;
          const documentDetails = <>
            <span className="doc-file"><FileText size={18} /><span><strong>{document.fields.supplier || document.fileName}</strong><small>{document.fields.invoiceNumber ? `${document.fields.invoiceNumber} · ` : ""}{document.fileType}</small></span></span>
            {!isClient && <span className="doc-client">{client.shortName} · {client.name.split(" ").slice(0, 2).join(" ")}</span>}
            <span className="doc-received">{document.receivedAt}</span>
            {isClient ? <ClientStatusBadge status={document.status} /> : <StatusBadge status={document.status} />}
            <span className="numeric">{document.fields.total > 0 ? `AED ${money(document.fields.total)}` : "Being checked"}</span>
            {!isClient && <ArrowRight size={16} />}
          </>;
          return isClient ? <div className="client-document-row" key={document.id}>{documentDetails}</div> : (
            <button key={document.id} onClick={() => demo.role === "Client" ? notify("Your accountant will review this document. Client access is upload and status tracking only.") : openDocument(document.id)}>
              {documentDetails}
            </button>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={Search} title={isClient ? "No documents found" : "No documents match"} text={isClient ? "Try a different search or upload a new document." : "Adjust the search or status filter to see more records."} />}
      </div>
      {uploadOpen && (
        <div className="modal-backdrop" onMouseDown={() => { if (!extracting) setUploadOpen(false); }}>
          <section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>{!isClient && <DemoTag />}<h2 id="upload-modal-title">{isClient ? "Send a document" : "Upload a bookkeeping document"}</h2><p>{isClient ? "Choose a receipt, bill, invoice, bank statement or spreadsheet. We will read it and send it to your accountant for review." : "Select a receipt, bill, invoice, statement, image, or spreadsheet. AI extracts supported PDFs and images first; browser OCR takes over automatically when AI is unavailable."}</p></div>
              <button className="modal-close" disabled={extracting} onClick={() => setUploadOpen(false)} aria-label="Close upload dialog"><X size={19} /></button>
            </header>
            <label className={`file-drop ${selectedFile ? "has-file" : ""}`}>
              <input type="file" disabled={extracting} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && (!ACCEPTED_UPLOAD_TYPES.includes(file.type) || file.size > MAX_UPLOAD_FILE_SIZE)) {
                  setSelectedFile(null);
                  setUploadError("Choose a PDF, JPG, or PNG file no larger than 10 MB.");
                  event.target.value = "";
                  return;
                }
                setUploadError("");
                setSelectedFile(file);
              }} />
              <span><CloudUpload size={25} /></span>
              <div><strong>{selectedFile ? selectedFile.name : "Choose a file from this device"}</strong><small>{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to send` : "Accepted files: PDF, JPG, and PNG up to 10 MB."}</small></div>
              {selectedFile && <CheckCircle2 size={19} />}
            </label>
            {uploadError && <p className="upload-error" role="alert"><AlertTriangle size={15} />{uploadError}</p>}
            {classification && !isClient && <div className="classification-result"><WandSparkles size={20} /><div><small>File-name suggestion (refined after OCR)</small><strong>{classification.label}</strong><p>Ledger: {classification.ledger}</p><span>{classification.reason}</span></div></div>}
            {demo.role !== "Client" && <label className="upload-client-select">Client workspace
              <select value={uploadClientId} disabled={extracting} onChange={(event) => setUploadClientId(event.target.value)}>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
              <ChevronDown size={15} />
            </label>}
            <div className="upload-demo-note"><ShieldCheck size={19} /><p><strong>{isClient ? "You only need to send the document" : "Human approval remains mandatory"}</strong><span>{isClient ? "Your accountant will check the supplier, date, amount, VAT and expense category before anything is added to your accounts." : "AI or OCR fills in the fields it can read. The category, ledger and amounts are suggestions until an accountant reviews and approves the balanced entry."}</span></p></div>
            <footer>
              <button className="button secondary" disabled={extracting} onClick={() => setUploadOpen(false)}>Cancel</button>
              <button className="button primary" disabled={!selectedFile || extracting} onClick={submitUpload}><CloudUpload size={16} /> {extracting ? (isClient ? "Sending document…" : progress || "Reading document…") : isClient ? "Send to my accountant" : "Upload for review"}</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

function ApprovalsScreen({ documents, openDocument }: { documents: BookkeepingDocument[]; openDocument: (id: string) => void }) {
  const pending = documents.filter((document) => document.status === "needs_review");
  return (
    <>
      <PageHeading title="Approval queue" description="Every proposed entry waits here for accountant judgement before it can leave the platform." actions={<span className="control-badge"><ShieldCheck size={15} /> Approval control active</span>} />
      <div className="queue-board">
        <div className="queue-summary"><span><strong>{pending.length}</strong> awaiting review</span><span><AlertTriangle size={15} /> {pending.filter((document) => document.warnings.length).length} with exceptions</span><span><Clock3 size={15} /> Oldest: 2 days</span></div>
        {pending.map((document, index) => (
          <button key={document.id} className="queue-item" onClick={() => openDocument(document.id)}>
            <span className="queue-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="queue-doc"><strong>{document.fields.supplier}</strong><small>{document.fields.documentType} · {document.fields.invoiceNumber}</small></span>
            <ClientMark clientId={document.clientId} compact />
            <span className="queue-flags">{document.duplicateOf ? <><AlertTriangle size={15} /> Duplicate hold</> : document.warnings.length ? <><MessageSquareText size={15} /> {document.warnings.length} checks</> : <><Check size={15} /> Ready</>}</span>
            <span className="amount"><strong>AED {money(document.fields.total)}</strong><small>{document.fields.confidence}% confidence</small></span>
            <span className="review-link">Review <ArrowRight size={15} /></span>
          </button>
        ))}
        {pending.length === 0 && <EmptyState icon={BadgeCheck} title="Nothing waiting" text="The review desk is clear. Reset the demo to restore the sample queue." />}
      </div>
    </>
  );
}

function IntegrationsScreen({ notify }: { notify: (message: string) => void }) {
  const demo = useDemo();
  const approved = demo.documents.filter((document) => postedStatusList.includes(document.status));
  const integrations = [
    { client: clients[0], icon: Landmark, detail: "OAuth connection and posting are represented by a safe simulator.", action: "Simulate Zoho handoff" },
    { client: clients[1], icon: DatabaseZap, detail: "A future Windows connector would pull approved entries while Tally is running.", action: "Preview connector queue" },
    { client: clients[2], icon: FileSpreadsheet, detail: "Download approved transactions as a genuine CSV file for Excel users.", action: "Download approved CSV" },
  ];
  return (
    <>
      <PageHeading title="Integration handoff" description="Approved work can be prepared for each client’s existing accounting destination." actions={<DemoTag />} />
      <SummaryBoxes items={[
        { label: "Ready to hand off", value: approved.filter((d) => d.status === "approved").length, icon: BadgeCheck, tone: "green" },
        { label: "Demo exported", value: demo.documents.filter((d) => d.status === "demo_exported").length, icon: Download, tone: "blue" },
        { label: "Demo synced", value: demo.documents.filter((d) => d.status === "demo_synced").length, icon: Send, tone: "amber" },
        { label: "Destinations", value: integrations.length, icon: DatabaseZap, tone: "coral" },
      ]} />
      <div className="integration-register">
        {integrations.map(({ client, icon: Icon, detail, action }, index) => {
          const clientApproved = approved.filter((document) => document.clientId === client.id).length;
          return (
            <section key={client.id}>
              <span className="integration-icon"><Icon size={24} /></span>
              <div className="integration-copy"><div><h2>{client.integration}</h2><DemoTag /></div><p>{detail}</p><ClientMark clientId={client.id} /></div>
              <div className="integration-state"><strong>{clientApproved}</strong><small>approved items available</small></div>
              <button className="button secondary" disabled={clientApproved === 0} onClick={() => {
                if (index === 2) { const count = demo.exportCsv(client.id); notify(`${count} approved entries downloaded as CSV.`); }
                else notify(index === 0 ? "Zoho handoff simulated. No live API was called." : "Connector queue previewed. Tally was not contacted.");
              }}>{index === 2 ? <Download size={16} /> : <Send size={16} />}{action}</button>
            </section>
          );
        })}
      </div>
      <div className="future-note"><Banknote size={23} /><div><strong>Bank reconciliation is intentionally not active.</strong><p>Statement recognition is shown in the inbox as a future-feature preview. The prototype does not claim to match or reconcile bank activity.</p></div><span>Future stage</span></div>
    </>
  );
}

function LearningScreen({ openDocument }: { openDocument: (id: string) => void }) {
  const { mappings, documents } = useDemo();
  const learnedDocument = documents.find((document) => document.learnedFromMapping);
  return (
    <>
      <PageHeading title="Learning insights" description="Only confirmed accountant corrections become client-specific supplier rules in this demonstration." actions={<DemoTag />} />
      <SummaryBoxes items={[
        { label: "Active rules", value: mappings.length, icon: WandSparkles, tone: "green" },
        { label: "Times applied", value: mappings.reduce((sum, m) => sum + Number(m.applications), 0), icon: Sparkles, tone: "amber" },
        { label: "Clients with rules", value: new Set(mappings.map((m) => m.clientId)).size, icon: Building2, tone: "blue" },
      ]} />
      <section className="learning-story">
        <div className="learning-copy"><span className="learning-icon"><WandSparkles size={25} /></span><h2>Corrections become controlled memory—not autonomous accounting policy.</h2><p>The same supplier can map differently for different clients. Every rule records who confirmed it and when.</p></div>
        <div className="before-after">
          <div><small>Original suggestion</small><strong>Gulf Office Mart</strong><span>Office Supplies</span></div>
          <ArrowRight size={22} />
          <div className="after"><small>Accountant-confirmed rule</small><strong>Gulf Office Mart</strong><span>{mappings.find((mapping) => mapping.supplier === "Gulf Office Mart")?.ledger ?? "Correct the first invoice to create this rule"}</span></div>
        </div>
      </section>
      <div className="mapping-register">
        <div className="section-title"><div><h2>Confirmed supplier rules</h2><p>Scoped per client and retained with evidence.</p></div><span>{mappings.length} active rules</span></div>
        <div className="mapping-head"><span>Supplier</span><span>Client</span><span>Previous suggestion</span><span>Confirmed ledger</span><span>Evidence</span></div>
        {mappings.map((mapping) => (
          <div className="mapping-row" key={mapping.id}>
            <strong>{mapping.supplier}</strong><ClientMark clientId={mapping.clientId} compact /><span>{mapping.previousLedger}</span><span className="confirmed-ledger"><CheckCircle2 size={15} />{mapping.ledger}</span><small>{mapping.confirmedBy}<br />{mapping.confirmedAt} · {mapping.applications} uses</small>
          </div>
        ))}
      </div>
      {learnedDocument && <button className="learned-callout" onClick={() => openDocument(learnedDocument.id)}><Sparkles size={19} /><span><strong>A later Gulf Office Mart invoice now uses the confirmed rule.</strong><small>Open {learnedDocument.fields.invoiceNumber} to see the explanation and audit event.</small></span><ArrowRight size={17} /></button>}
    </>
  );
}

function FinancialStatementsScreen({ openDocument }: { openDocument: (id: string) => void }) {
  const demo = useDemo();
  const [statement, setStatement] = useState<"balance" | "trial" | "profit">("balance");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const clientId = demo.selectedClientId === "all" ? "c1" : demo.selectedClientId;
  const financials = clientFinancials.find((item) => item.clientId === clientId)!;
  const client = clients.find((item) => item.id === clientId)!;
  const postedStatuses = new Set(["approved", "demo_exported", "demo_synced"]);
  const postedUploads = demo.documents.filter((document) => document.clientId === clientId && document.isUserUpload && postedStatuses.has(document.status));
  const uploadGroups = new Map<string, { balance: number; documentIds: string[] }>();
  postedUploads.forEach((document) => {
    const current = uploadGroups.get(document.suggestedLedger) ?? { balance: 0, documentIds: [] };
    current.balance += document.fields.subtotal;
    current.documentIds.push(document.id);
    uploadGroups.set(document.suggestedLedger, current);
  });
  const normalizeAccount = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const consumedGroups = new Set<string>();
  const uploadPayables = postedUploads.filter((document) => document.journal.some((line) => line.account === "Accounts Payable" && line.credit > 0)).reduce((sum, document) => sum + document.fields.total, 0);
  const uploadBankPayments = postedUploads.filter((document) => document.journal.some((line) => line.account === "Bank & cash" && line.credit > 0)).reduce((sum, document) => sum + document.fields.total, 0);
  const uploadInputVat = postedUploads.reduce((sum, document) => sum + document.fields.tax, 0);
  const adjustedAccounts = financials.accounts.map((account) => {
    if (account.category === "Asset" && normalizeAccount(account.name) === "bankcash") {
      return { ...account, balance: account.balance - uploadBankPayments, documentIds: [...account.documentIds, ...postedUploads.filter((document) => document.journal.some((line) => line.account === "Bank & cash" && line.credit > 0)).map((document) => document.id)] };
    }
    if (account.category === "Liability" && normalizeAccount(account.name) === "accountspayable") {
      return { ...account, balance: account.balance + uploadPayables, documentIds: [...account.documentIds, ...postedUploads.map((document) => document.id)] };
    }
    if (account.category === "Expense") {
      const match = [...uploadGroups.entries()].find(([ledger]) => normalizeAccount(ledger) === normalizeAccount(account.name));
      if (match) {
        consumedGroups.add(match[0]);
        return { ...account, balance: account.balance + match[1].balance, documentIds: [...account.documentIds, ...match[1].documentIds] };
      }
    }
    return account;
  });
  if (uploadInputVat > 0) adjustedAccounts.push({ id: `${clientId}-upload-input-vat`, code: "1250", name: "Input VAT recoverable", category: "Asset", balance: uploadInputVat, documentIds: postedUploads.filter((document) => document.fields.tax > 0).map((document) => document.id) });
  [...uploadGroups.entries()].forEach(([ledger, group], index) => {
    if (!consumedGroups.has(ledger)) adjustedAccounts.push({ id: `${clientId}-upload-${normalizeAccount(ledger)}`, code: `59${index + 1}0`, name: ledger, category: "Expense", balance: group.balance, documentIds: group.documentIds });
  });
  const amount = (account: FinancialAccount) => account.balance;
  const byCategory = (category: FinancialAccount["category"]) => adjustedAccounts.filter((account) => account.category === category);
  const total = (category: FinancialAccount["category"]) => byCategory(category).reduce((sum, account) => sum + amount(account), 0);
  const assets = total("Asset");
  const liabilities = total("Liability");
  const openingEquity = total("Equity");
  const income = total("Income");
  const expenses = total("Expense");
  const netProfit = income - expenses;
  const equity = openingEquity + netProfit;
  const balanced = Math.abs(assets - (liabilities + equity)) < 0.01;
  const activeAccount = adjustedAccounts.find((account) => account.id === activeAccountId) ?? null;
  const linkedDocuments = activeAccount ? demo.documents.filter((document) => activeAccount.documentIds.includes(document.id) && postedStatuses.has(document.status)) : [];
  const statementDate = financials.asOf;

  const selectClient = (id: string) => {
    demo.setSelectedClientId(id);
    setActiveAccountId(null);
  };

  const AccountRow = ({ account }: { account: FinancialAccount }) => (
    <button className="statement-row" onClick={() => setActiveAccountId(activeAccountId === account.id ? null : account.id)} aria-expanded={activeAccountId === account.id}>
      <span><small>{account.code}</small><strong>{account.name}</strong></span>
      <span>AED {money(amount(account))}</span>
      <ArrowRight size={15} />
    </button>
  );

  return (
    <>
      <PageHeading
        title="Financial statements"
        description="Illustrative company-level statements built from synthetic opening balances and demo transactions."
        actions={<><button className="button secondary" onClick={() => downloadFinancialStatementPdf({ client, accounts: adjustedAccounts, statement, statementDate })}><Download size={16} /> Download PDF</button><span className="demo-tag"><Sparkles size={12} /> Demo / Illustrative</span><span className={`control-badge ${balanced ? "" : "control-error"}`}><Scale size={15} />{balanced ? "Illustration balances" : "Out of balance"}</span></>}
      />

      <SummaryBoxes items={[
        { label: "Total assets", value: `AED ${money(assets)}`, icon: Landmark, tone: "blue" },
        { label: "Total liabilities", value: `AED ${money(liabilities)}`, icon: Banknote, tone: "coral" },
        { label: "Equity", value: `AED ${money(equity)}`, icon: Scale, tone: "amber" },
        { label: "Net profit", value: `AED ${money(netProfit)}`, icon: BadgeCheck, tone: "green" },
      ]} />

      <div className="statement-client-tabs" aria-label="Select company">
        {clients.map((item) => <button key={item.id} className={item.id === clientId ? "active" : ""} onClick={() => selectClient(item.id)}><ClientMark clientId={item.id} /></button>)}
      </div>

      <section className="statement-toolbar">
        <div><strong>{client.name}</strong><small>{client.integration} workspace · AED reporting currency</small></div>
        <div className="report-period"><small>Reporting period</small><strong>November 2026</strong></div>
      </section>

      <div className="statement-tabs" role="tablist" aria-label="Financial statement type">
        <button role="tab" aria-selected={statement === "balance"} className={statement === "balance" ? "active" : ""} onClick={() => { setStatement("balance"); setActiveAccountId(null); }}>Balance sheet</button>
        <button role="tab" aria-selected={statement === "trial"} className={statement === "trial" ? "active" : ""} onClick={() => { setStatement("trial"); setActiveAccountId(null); }}>Trial balance</button>
        <button role="tab" aria-selected={statement === "profit"} className={statement === "profit" ? "active" : ""} onClick={() => { setStatement("profit"); setActiveAccountId(null); }}>Profit & loss</button>
      </div>

      {statement === "balance" && <section className="balance-sheet">
        <header><div><h2>Balance sheet</h2><p>As at {statementDate}</p></div><DemoTag /></header>
        <div className="balance-equation" aria-label={`Assets ${money(assets)} equals liabilities and equity ${money(liabilities + equity)}`}>
          <div><small>Assets</small><strong>AED {money(assets)}</strong></div><span>=</span><div><small>Liabilities</small><strong>AED {money(liabilities)}</strong></div><span>+</span><div><small>Equity</small><strong>AED {money(equity)}</strong></div><BadgeCheck size={24} />
        </div>
        <div className="statement-columns">
          <div className="statement-section"><div className="statement-section-title"><h3>Assets</h3><span>AED {money(assets)}</span></div>{byCategory("Asset").map((account) => <AccountRow key={account.id} account={account} />)}<div className="statement-total"><strong>Total assets</strong><strong>AED {money(assets)}</strong></div></div>
          <div>
            <div className="statement-section"><div className="statement-section-title"><h3>Liabilities</h3><span>AED {money(liabilities)}</span></div>{byCategory("Liability").map((account) => <AccountRow key={account.id} account={account} />)}<div className="statement-total"><strong>Total liabilities</strong><strong>AED {money(liabilities)}</strong></div></div>
            <div className="statement-section equity-section"><div className="statement-section-title"><h3>Equity</h3><span>AED {money(equity)}</span></div>{byCategory("Equity").map((account) => <AccountRow key={account.id} account={account} />)}<button className="statement-row computed-row" onClick={() => setStatement("profit")}><span><small>Current period</small><strong>Net profit</strong></span><span>AED {money(netProfit)}</span><ArrowRight size={15} /></button><div className="statement-total"><strong>Total equity</strong><strong>AED {money(equity)}</strong></div></div>
          </div>
        </div>
        <div className="statement-balance-check"><BadgeCheck size={21} /><div><strong>Balanced: Assets equal Liabilities plus Equity</strong><p>AED {money(assets)} = AED {money(liabilities)} + AED {money(equity)}. Figures are synthetic and are not a filed financial statement.</p></div></div>
      </section>}

      {statement === "trial" && <section className="trial-balance">
        <header><div><h2>Trial balance</h2><p>As at {statementDate}</p></div><DemoTag /></header>
        <div className="trial-head"><span>Code & account</span><span>Category</span><span>Debit AED</span><span>Credit AED</span><span /></div>
        {adjustedAccounts.map((account) => {
          const debit = account.category === "Asset" || account.category === "Expense";
          return <button className="trial-row" key={account.id} onClick={() => setActiveAccountId(activeAccountId === account.id ? null : account.id)}><span><small>{account.code}</small><strong>{account.name}</strong></span><span>{account.category}</span><span>{debit ? money(amount(account)) : "—"}</span><span>{debit ? "—" : money(amount(account))}</span><ArrowRight size={15} /></button>;
        })}
        <div className="trial-total"><strong>Trial balance totals</strong><span>AED {money(assets + expenses)}</span><span>AED {money(liabilities + openingEquity + income)}</span><span className="balanced"><CheckCircle2 size={14} /> Balanced</span></div>
      </section>}

      {statement === "profit" && <section className="profit-sheet">
        <header><div><h2>Profit & loss</h2><p>For the period ending {statementDate}</p></div><DemoTag /></header>
        <div className="profit-summary"><div><small>Income</small><strong>AED {money(income)}</strong></div><span>−</span><div><small>Expenses</small><strong>AED {money(expenses)}</strong></div><span>=</span><div className="profit-result"><small>Net profit</small><strong>AED {money(netProfit)}</strong></div></div>
        <div className="statement-columns"><div className="statement-section"><div className="statement-section-title"><h3>Income</h3><span>AED {money(income)}</span></div>{byCategory("Income").map((account) => <AccountRow key={account.id} account={account} />)}<div className="statement-total"><strong>Total income</strong><strong>AED {money(income)}</strong></div></div><div className="statement-section"><div className="statement-section-title"><h3>Operating expenses</h3><span>AED {money(expenses)}</span></div>{byCategory("Expense").map((account) => <AccountRow key={account.id} account={account} />)}<div className="statement-total"><strong>Total expenses</strong><strong>AED {money(expenses)}</strong></div></div></div>
      </section>}

      {activeAccount && <section className="account-drilldown">
        <div className="drilldown-head"><div><span className="account-code">{activeAccount.code}</span><h2>{activeAccount.name}</h2><p>{activeAccount.category} account · {client.name}</p></div><div><small>Illustrative balance</small><strong>AED {money(amount(activeAccount))}</strong><button onClick={() => setActiveAccountId(null)} aria-label="Close account detail"><X size={17} /></button></div></div>
        <div className="drilldown-body"><h3>Approved supporting demo documents</h3>{linkedDocuments.length ? linkedDocuments.map((document) => <DocumentRow key={document.id} document={document} onOpen={() => openDocument(document.id)} />) : <div className="opening-balance-note"><History size={18} /><span><strong>Synthetic opening or summary balance</strong><small>No approved source document is attached. Unreviewed and rejected documents are never presented as support for this illustration.</small></span></div>}</div>
      </section>}

      <div className="financial-disclaimer"><ShieldCheck size={22} /><div><strong>Illustrative statements, not production books</strong><p>These statements use synthetic opening balances and demo transactions to show the intended workflow. A production balance sheet requires a complete ledger, opening-balance migration, posting controls, period close, adjustments, and qualified accountant review.</p></div></div>
    </>
  );
}

function ReviewScreen({ document, nextReviewDocumentId, onBack, onNext, notify }: {
  document: BookkeepingDocument;
  nextReviewDocumentId: string | null;
  onBack: () => void;
  onNext: (id: string) => void;
  notify: (message: string) => void;
}) {
  const demo = useDemo();
  const [confirmMapping, setConfirmMapping] = useState(false);
  const [tab, setTab] = useState<"entry" | "history">("entry");
  const client = clients.find((item) => item.id === document.clientId)!;
  const balance = isBalanced(document.journal);
  const canReview = document.status === "needs_review" || document.status === "uploaded" || document.status === "processing";
  // Safety check: the journal should add up to the document total
  const journalMismatch = document.fields.documentType !== "Bank statement" && document.fields.total > 0 && Math.abs(balance.debit - document.fields.total) > 0.01;
  const approve = () => {
    const result = demo.approve(document.id, confirmMapping);
    notify(result.message);
  };
  return (
    <div className="review-page">
      <div className="review-topline">
        <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to queue</button>
        <div><ClientMark clientId={document.clientId} /><DemoTag /></div>
      </div>
      <div className="review-title"><div><h1>{document.fields.supplier}</h1><p>{document.fileName} · Received from {document.source}</p></div><div className="heading-actions"><button className="button secondary" onClick={() => downloadDocumentPdf(document, client)}><Download size={16} /> Download PDF</button><StatusBadge status={document.status} /></div></div>
      {document.duplicateOf && <div className="blocking-alert"><AlertTriangle size={21} /><div><strong>Approval blocked: probable duplicate invoice</strong><p>The same client, supplier, and invoice number match an approved document. Resolve this exception outside the prototype before approval.</p></div></div>}
      {journalMismatch && <div className="blocking-alert"><AlertTriangle size={21} /><div><strong>Journal total does not match the document total</strong><p>The journal adds up to AED {money(balance.debit)} but the document total is AED {money(document.fields.total)}. Check the amounts before approving.</p></div></div>}
      {document.learnedFromMapping && <div className="learning-alert"><Sparkles size={20} /><div><strong>Client-specific rule applied</strong><p>This ledger came from a confirmed correction for {document.fields.supplier}. The original model suggestion remains preserved in history.</p></div></div>}
      <div className="review-grid">
        <DocumentPreview document={document} />
        <section className="review-panel">
          <div className="panel-tabs" role="tablist"><button role="tab" aria-selected={tab === "entry"} className={tab === "entry" ? "active" : ""} onClick={() => setTab("entry")}><Bot size={16} /> Extract & suggest</button><button role="tab" aria-selected={tab === "history"} className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><History size={16} /> Activity</button></div>
          {tab === "history" ? <AuditTrail document={document} /> : (
            <div className="review-form">
              <div className="confidence-line"><span><WandSparkles size={16} /> {document.isUserUpload ? (document.extractionSource === "demo" ? "Demo extraction" : `${document.extractionSource?.toUpperCase() ?? "AI"} extraction`) : "Deterministic mock extraction"}</span><strong>{document.extractionSource && <em className={`extraction-badge extraction-${document.extractionSource}`}>{document.extractionSource === "demo" ? "DEMO" : document.extractionSource.toUpperCase()}</em>}{document.fields.confidence}% confidence</strong></div>
              {document.classificationReason && <div className="classification-evidence"><WandSparkles size={17} /><div><strong>{document.extractionSource === "demo" ? "Demo extraction" : "AI explanation"}</strong><p>{document.classificationReason}</p></div></div>}
              <div className="field-grid">
                <label className="span-2">Supplier<input value={document.fields.supplier} onChange={(event) => demo.updateFields(document.id, { supplier: event.target.value })} /></label>
                <label>Invoice date<input type="date" value={document.fields.date} onChange={(event) => demo.updateFields(document.id, { date: event.target.value })} /></label>
                <label>Invoice number<input value={document.fields.invoiceNumber} onChange={(event) => demo.updateFields(document.id, { invoiceNumber: event.target.value })} /></label>
                <label>Subtotal (AED)<input type="number" value={document.fields.subtotal} onChange={(event) => demo.updateFields(document.id, { subtotal: Number(event.target.value) })} /></label>
                <label>VAT (AED)<input type="number" value={document.fields.tax} onChange={(event) => demo.updateFields(document.id, { tax: Number(event.target.value) })} /></label>
              </div>
              {document.warnings.length > 0 && <div className="warning-list">{document.warnings.map((warning) => <p key={warning}><AlertTriangle size={15} />{warning}</p>)}</div>}
              {document.fields.documentType === "Bank statement" ? <div className="future-panel"><Banknote size={22} /><strong>Statement preview only</strong><p>Real matching and reconciliation are intentionally outside this prototype.</p></div> : (
                <>
                  <div className="suggestion-head"><div><h2>Accounting suggestion</h2><p>{document.transactionType} · {document.vatTreatment}</p></div><span className={balance.balanced ? "balanced" : "unbalanced"}>{balance.balanced ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{balance.balanced ? "Balanced" : "Out of balance"}</span></div>
                  <label className="ledger-select">Expense / asset ledger<select value={document.suggestedLedger} onChange={(event) => demo.updateLedger(document.id, event.target.value)}>{ledgerOptions.map((ledger) => <option key={ledger}>{ledger}</option>)}</select><ChevronDown size={14} /></label>
                  <div className="journal-table"><div><span>Account</span><span>Debit</span><span>Credit</span></div>{document.journal.map((line) => <div key={line.id}><strong>{line.account}</strong><span>{line.debit ? money(line.debit) : "—"}</span><span>{line.credit ? money(line.credit) : "—"}</span></div>)}<div className="journal-total"><strong>Total AED</strong><strong>{money(balance.debit)}</strong><strong>{money(balance.credit)}</strong></div></div>
                  {document.suggestedLedger !== document.originalLedger && <label className="mapping-check"><input type="checkbox" checked={confirmMapping} onChange={(event) => setConfirmMapping(event.target.checked)} /><span><strong>Remember this correction for {document.fields.supplier}</strong><small>Applies only to {client.name}. Future documents still require review.</small></span></label>}
                </>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="review-actions">
        <div><ShieldCheck size={17} /><span><strong>Accountant approval required</strong><small>Nothing can sync while this control is pending.</small></span></div>
        {demo.role === "Client" ? <button className="button secondary" onClick={onBack}><ArrowLeft size={16} /> Return to my documents</button> : document.status === "uploaded" ? <button className="button primary" onClick={() => { demo.simulateProcess(document.id); notify("Mock extraction completed; document is ready for review."); }}><WandSparkles size={16} /> Run demo extraction</button> : canReview ? <>
          <button className="button danger" onClick={() => { demo.setStatus(document.id, "rejected", "Rejected and clarification requested"); notify("Document rejected; clarification request recorded."); }}><XCircle size={16} /> Reject</button>
          <button className="button secondary" onClick={() => { demo.setStatus(document.id, "needs_review", "Clarification requested from client"); notify("Clarification request added to the activity trail."); }}><MessageSquareText size={16} /> Request clarification</button>
          <button className="button primary" disabled={!!document.duplicateOf || document.fields.documentType === "Bank statement" || !balance.balanced} onClick={approve}><Stamp size={16} /> Approve transaction</button>
        </> : <>
          <button className="button secondary" onClick={onBack}><ArrowLeft size={16} /> Return to workspace</button>
          {document.status === "approved" && nextReviewDocumentId && (
            <button className="button primary" onClick={() => onNext(nextReviewDocumentId)}>Next case <ArrowRight size={16} /></button>
          )}
        </>}
      </footer>
    </div>
  );
}

function DocumentPreview({ document }: { document: BookkeepingDocument }) {
  const [storedFile, setStoredFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void getDocumentFile(document.id).then((file) => {
      if (!active || !file) return;
      objectUrl = URL.createObjectURL(file);
      setStoredFile(file);
      setFileUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id]);

  const downloadOriginal = () => {
    if (!fileUrl || !storedFile) return;
    const anchor = window.document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = document.fileName;
    anchor.click();
  };

  return (
    <section className="preview-panel">
      <div className="preview-toolbar"><span><FileText size={16} /> Source document</span><span>{storedFile && <button className="preview-download" onClick={downloadOriginal}><Download size={14} /> Download original</button>}<span className="preview-format">{document.fileType}</span></span></div>
      {fileUrl ? <div className="stored-file-stage">{storedFile?.type === "application/pdf" ? <iframe src={fileUrl} title={`Original ${document.fileName}`} /> : <img src={fileUrl} alt={`Original ${document.fileName}`} />}</div> : <div className="paper-stage">
        <article className="invoice-paper">
          <div className="invoice-brand"><span>{document.fields.supplier.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><strong>{document.fields.supplier}</strong><small>{document.isUserUpload ? `VALUES READ BY ${document.extractionSource?.toUpperCase() ?? "OCR"}` : "FICTIONAL DEMO SUPPLIER"}</small></div></div>
          <div className="invoice-label"><strong>{document.fields.documentType === "Receipt" ? "RECEIPT" : document.fields.documentType.toUpperCase()}</strong><span>#{document.fields.invoiceNumber}</span></div>
          <div className="invoice-meta"><div><small>BILL TO</small><strong>{clients.find((client) => client.id === document.clientId)?.name}</strong></div><div><small>DATE</small><strong>{document.fields.date}</strong></div></div>
          <div className="invoice-lines"><div><strong>Description</strong><strong>Amount</strong></div><div><span>Professional goods / services</span><span>AED {money(document.fields.subtotal)}</span></div><div><span>VAT 5%</span><span>AED {money(document.fields.tax)}</span></div></div>
          <div className="invoice-total"><span>Total</span><strong>AED {money(document.fields.total)}</strong></div>
          <div className="invoice-stamp">{document.isUserUpload ? <>{document.extractionSource?.toUpperCase() ?? "OCR"}<br />SUMMARY</> : <>SYNTHETIC<br />DEMO</>}</div>
          <p className="invoice-foot">{document.isUserUpload ? "Summary of the values extracted from your uploaded file. Every suggestion still requires accountant review." : "This generated preview contains no real financial or customer information."}</p>
        </article>
      </div>}
      <div className="preview-caption"><FileSearch size={15} /><span>Fields on the right are linked to this source preview.</span></div>
    </section>
  );
}

function AuditTrail({ document }: { document: BookkeepingDocument }) {
  return <div className="audit-trail">{document.audit.map((event, index) => <div key={event.id}><span className="audit-dot">{index === 0 ? <Activity size={14} /> : <Clock3 size={14} />}</span><p><strong>{event.action}</strong><small>{event.actor} · {event.at}</small></p></div>)}</div>;
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Inbox; title: string; text: string }) {
  return <div className="empty-state"><Icon size={24} /><strong>{title}</strong><p>{text}</p></div>;
}

export default function BookkeepingApp() {
  return <DemoProvider><App /></DemoProvider>;
}
