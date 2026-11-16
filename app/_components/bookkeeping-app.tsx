"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BookOpenCheck,
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
  ShieldCheck,
  Sparkles,
  Stamp,
  WandSparkles,
  X,
  XCircle,
} from "lucide-react";
import { clients, ledgerOptions } from "@/lib/fixtures";
import { isBalanced } from "@/lib/adapters";
import type { BookkeepingDocument, DocumentStatus, View } from "@/lib/types";
import { DemoProvider, useDemo } from "./demo-store";

const money = (value: number) => new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

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
  { id: "approvals", label: "Approval queue", icon: Stamp },
  { id: "integrations", label: "Integrations", icon: DatabaseZap },
  { id: "learning", label: "Learning insights", icon: Lightbulb },
];

function StatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`status-badge status-${status}`}><CircleDot size={12} />{statusLabels[status]}</span>;
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

function App() {
  const demo = useDemo();
  const [view, setView] = useState<View>("overview");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeDocument = demo.documents.find((document) => document.id === activeDocumentId);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };
  const navigate = (next: View) => {
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

  return (
    <div className="app-frame">
      {/* THESIS: AI suggestions become accountable working papers, refusing the generic metric-card dashboard. */}
      {/* OWN-WORLD: Warm ledger paper, ink navy, teal approvals, vermilion exceptions, ruled work surfaces. */}
      {/* STORY: See the firm queue, inspect evidence, correct the entry, approve, and safely hand off. */}
      {/* FIRST VIEWPORT: Dark docket rail at left; a wide live work ledger dominates; controls sit in the top line. */}
      {/* FORM: Accountant's working desk, selected first-order direction, seed key LEDGER-DESK-01. */}
      {/* FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <span className="brand-glyph"><BookOpenCheck size={22} /></span>
          <span><strong>Ledgerly</strong><small>Review desk</small></span>
        </div>
        <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        <nav aria-label="Main navigation">
          {navItems.filter((item) => demo.role !== "Client" || ["overview", "inbox"].includes(item.id)).map((item) => {
            const Icon = item.icon;
            const count = item.id === "approvals" ? pendingCount : undefined;
            return (
              <button key={item.id} aria-current={view === item.id && !activeDocument ? "page" : undefined} className={view === item.id && !activeDocument ? "active" : ""} onClick={() => navigate(item.id)}>
                <Icon size={18} /><span>{item.label}</span>{count !== undefined && <em>{count}</em>}
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
              <select value={demo.role} onChange={(event) => { const role = event.target.value as typeof demo.role; demo.setRole(role); if (role === "Client" && !["overview", "inbox"].includes(view)) navigate("overview"); }}>
                <option>Firm Admin</option><option>Accountant</option><option>Client</option>
              </select>
            </label>
            <span className="avatar">AK</span>
          </div>
        </header>

        <main className="workspace">
          {activeDocument ? (
            <ReviewScreen document={activeDocument} onBack={() => setActiveDocumentId(null)} notify={showToast} />
          ) : view === "overview" ? (
            <Overview documents={visibleDocuments} openDocument={openDocument} navigate={navigate} />
          ) : view === "clients" ? (
            <ClientsScreen openClient={(id) => { demo.setSelectedClientId(id); navigate("inbox"); }} />
          ) : view === "inbox" ? (
            <InboxScreen documents={visibleDocuments} openDocument={openDocument} notify={showToast} />
          ) : view === "approvals" ? (
            <ApprovalsScreen documents={visibleDocuments} openDocument={openDocument} />
          ) : view === "integrations" ? (
            <IntegrationsScreen notify={showToast} />
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
  const approved = documents.filter((document) => ["approved", "demo_exported", "demo_synced"].includes(document.status));
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
  const filtered = documents.filter((document) =>
    (status === "all" || document.status === status) &&
    `${document.fields.supplier} ${document.fields.invoiceNumber} ${document.fileName}`.toLowerCase().includes(search.toLowerCase()));
  const uploadClient = demo.selectedClientId === "all" ? "c1" : demo.selectedClientId;
  return (
    <>
      <PageHeading title="Document inbox" description="A single intake point for portal, email, shared-folder, and WhatsApp-imported records." actions={<DemoTag />} />
      <section className="upload-band">
        <div className="upload-illustration"><CloudUpload size={28} /><span><i /><i /><i /></span></div>
        <div><h2>Bring a synthetic document into the workflow</h2><p>This demo creates a deterministic sample invoice—no file leaves your browser.</p></div>
        <button className="button primary" onClick={() => { const id = demo.simulateUpload(uploadClient); notify("Synthetic invoice added to the inbox."); window.setTimeout(() => openDocument(id), 250); }}><CloudUpload size={16} /> Simulate upload</button>
      </section>
      <div className="table-tools">
        <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier, invoice, or file" /></label>
        <label className="filter-select"><Settings2 size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="needs_review">Needs review</option><option value="approved">Approved</option><option value="uploaded">Uploaded</option><option value="processing">Processing</option><option value="rejected">Rejected</option></select><ChevronDown size={14} /></label>
        <span className="result-count">{filtered.length} records</span>
      </div>
      <div className="document-table">
        <div className="document-table-head"><span>Document</span><span>Client</span><span>Received</span><span>Status</span><span>Value</span><span /></div>
        {filtered.map((document) => {
          const client = clients.find((item) => item.id === document.clientId)!;
          return (
            <button key={document.id} onClick={() => openDocument(document.id)}>
              <span className="doc-file"><FileText size={18} /><span><strong>{document.fields.supplier}</strong><small>{document.fields.invoiceNumber} · {document.fileType}</small></span></span>
              <span className="doc-client">{client.shortName} · {client.name.split(" ").slice(0, 2).join(" ")}</span>
              <span className="doc-received">{document.receivedAt}</span>
              <StatusBadge status={document.status} />
              <span className="numeric">AED {money(document.fields.total)}</span>
              <ArrowRight size={16} />
            </button>
          );
        })}
        {filtered.length === 0 && <EmptyState icon={Search} title="No documents match" text="Adjust the search or status filter to see more records." />}
      </div>
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
  const approved = demo.documents.filter((document) => ["approved", "demo_exported", "demo_synced"].includes(document.status));
  const integrations = [
    { client: clients[0], icon: Landmark, detail: "OAuth connection and posting are represented by a safe simulator.", action: "Simulate Zoho handoff" },
    { client: clients[1], icon: DatabaseZap, detail: "A future Windows connector would pull approved entries while Tally is running.", action: "Preview connector queue" },
    { client: clients[2], icon: FileSpreadsheet, detail: "Download approved transactions as a genuine CSV file for Excel users.", action: "Download approved CSV" },
  ];
  return (
    <>
      <PageHeading title="Integration handoff" description="Approved work can be prepared for each client’s existing accounting destination." actions={<DemoTag />} />
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

function ReviewScreen({ document, onBack, notify }: { document: BookkeepingDocument; onBack: () => void; notify: (message: string) => void }) {
  const demo = useDemo();
  const [confirmMapping, setConfirmMapping] = useState(false);
  const [tab, setTab] = useState<"entry" | "history">("entry");
  const client = clients.find((item) => item.id === document.clientId)!;
  const balance = isBalanced(document.journal);
  const canReview = document.status === "needs_review" || document.status === "uploaded" || document.status === "processing";
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
      <div className="review-title"><div><h1>{document.fields.supplier}</h1><p>{document.fileName} · Received from {document.source}</p></div><StatusBadge status={document.status} /></div>
      {document.duplicateOf && <div className="blocking-alert"><AlertTriangle size={21} /><div><strong>Approval blocked: probable duplicate invoice</strong><p>The same client, supplier, and invoice number match an approved document. Resolve this exception outside the prototype before approval.</p></div></div>}
      {document.learnedFromMapping && <div className="learning-alert"><Sparkles size={20} /><div><strong>Client-specific rule applied</strong><p>This ledger came from a confirmed correction for {document.fields.supplier}. The original model suggestion remains preserved in history.</p></div></div>}
      <div className="review-grid">
        <DocumentPreview document={document} />
        <section className="review-panel">
          <div className="panel-tabs" role="tablist"><button role="tab" aria-selected={tab === "entry"} className={tab === "entry" ? "active" : ""} onClick={() => setTab("entry")}><Bot size={16} /> Extract & suggest</button><button role="tab" aria-selected={tab === "history"} className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><History size={16} /> Activity</button></div>
          {tab === "history" ? <AuditTrail document={document} /> : (
            <div className="review-form">
              <div className="confidence-line"><span><WandSparkles size={16} /> Deterministic mock extraction</span><strong>{document.fields.confidence}% confidence</strong></div>
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
        </> : <button className="button secondary" onClick={onBack}><ArrowLeft size={16} /> Return to workspace</button>}
      </footer>
    </div>
  );
}

function DocumentPreview({ document }: { document: BookkeepingDocument }) {
  return (
    <section className="preview-panel">
      <div className="preview-toolbar"><span><FileText size={16} /> Source document</span><span className="preview-format">{document.fileType}</span></div>
      <div className="paper-stage">
        <article className="invoice-paper">
          <div className="invoice-brand"><span>{document.fields.supplier.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><div><strong>{document.fields.supplier}</strong><small>FICTIONAL DEMO SUPPLIER</small></div></div>
          <div className="invoice-label"><strong>{document.fields.documentType === "Receipt" ? "RECEIPT" : document.fields.documentType.toUpperCase()}</strong><span>#{document.fields.invoiceNumber}</span></div>
          <div className="invoice-meta"><div><small>BILL TO</small><strong>{clients.find((client) => client.id === document.clientId)?.name}</strong></div><div><small>DATE</small><strong>{document.fields.date}</strong></div></div>
          <div className="invoice-lines"><div><strong>Description</strong><strong>Amount</strong></div><div><span>Professional goods / services</span><span>AED {money(document.fields.subtotal)}</span></div><div><span>VAT 5%</span><span>AED {money(document.fields.tax)}</span></div></div>
          <div className="invoice-total"><span>Total</span><strong>AED {money(document.fields.total)}</strong></div>
          <div className="invoice-stamp">SYNTHETIC<br />DEMO</div>
          <p className="invoice-foot">This generated preview contains no real financial or customer information.</p>
        </article>
      </div>
      <div className="preview-caption"><FileSearch size={15} /><span>Fields on the right are linked to this synthetic source preview.</span></div>
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
