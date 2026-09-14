import { createActor } from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Sprout,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

/** Backend SupportPriority variant (bindings are stale; contract from support.mo). */
type SupportPriority = "urgent" | "important";

/** Backend SupportStatus variant (bindings are stale; contract from support.mo). */
type SupportStatus = "open" | "inProgress" | "resolved" | "closed";

/** Backend SupportRequest record (bindings are stale; contract from support.mo). */
interface SupportRequest {
  id: bigint;
  subject: string;
  category: string;
  description: string;
  priority: SupportPriority;
  attachments: string[];
  status: SupportStatus;
  createdAt: bigint;
}

/** Minimal actor surface exposing the support methods present on the backend. */
interface SupportActor {
  addSupportRequest(request: SupportRequest): Promise<bigint>;
}

interface HelpArticle {
  id: string;
  title: string;
  summary: string;
  section: string;
  icon: typeof BookOpen;
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "getting-started-1",
    title: "Create your first farm record",
    summary:
      "Add a farm, its location, total area, and manager to start tracking operations in Malawi.",
    section: "Getting Started",
    icon: BookOpen,
  },
  {
    id: "getting-started-2",
    title: "Register crops and production plans",
    summary:
      "Set up crop varieties, planting cycles, and expected yields for each of your farms.",
    section: "Getting Started",
    icon: Sprout,
  },
  {
    id: "dashboard-1",
    title: "Reading your dashboard KPIs",
    summary:
      "Understand the key performance indicators shown on the home dashboard, from managed area to active farms.",
    section: "Understanding the Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "dashboard-2",
    title: "Market prices and weather widgets",
    summary:
      "Use the commodity price feed and forecast widgets to plan sales and field activities.",
    section: "Understanding the Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "module-1",
    title: "Recording a sale in MWK",
    summary:
      "Log a sales transaction with crop, quantity, buyer, and unit price in Malawian Kwacha.",
    section: "Module Help",
    icon: FileText,
  },
  {
    id: "module-2",
    title: "Managing inventory levels",
    summary:
      "Track stock for inputs, produce, and equipment, and set thresholds for low-stock alerts.",
    section: "Module Help",
    icon: FileText,
  },
  {
    id: "module-3",
    title: "Generating operational reports",
    summary:
      "Create soil, market, field activity, and yield reports to review performance.",
    section: "Module Help",
    icon: FileText,
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I add a new farm to the system?",
    answer:
      "Open the Farms module from the sidebar and click 'Add New Farm'. Fill in the farm name, location, total area in hectares, and the assigned manager, then save. The farm appears in your list immediately.",
  },
  {
    question: "What currency are sales recorded in?",
    answer:
      "All sales and payments are recorded in Malawian Kwacha (MWK), the national currency of Malawi. Prices are entered and displayed in MWK throughout the platform.",
  },
  {
    question: "How do I attach files to a support request?",
    answer:
      "In the 'Submit a New Support Request' form, click 'Attach files' and choose one or more documents or images. Files are uploaded securely and attached to your request for the support team to review.",
  },
  {
    question: "Can I change a user's role or permissions?",
    answer:
      "Yes. Administrators can manage user roles from the Users module. The User Roles & Permissions table on this page explains what each role can access.",
  },
  {
    question: "How do I report a problem with a module?",
    answer:
      "Use the support request form to describe the issue, select the relevant category and priority, and submit. Our team will respond and update the request status as it is resolved.",
  },
];

const ROLE_ROWS = [
  {
    role: "Super Admin",
    description:
      "Full access to every module, user management, and system settings.",
    permissions: ["All modules", "Manage users", "System settings"],
  },
  {
    role: "Admin",
    description:
      "Manage farms, crops, sales, and reports within their organization.",
    permissions: ["Agriculture", "Sales & Finance", "Reports"],
  },
  {
    role: "Field Officer",
    description:
      "Record field activities, crop productions, and inventory updates.",
    permissions: ["Crop productions", "Inventory", "Farms"],
  },
  {
    role: "Viewer",
    description:
      "Read-only access to dashboards, reports, and market information.",
    permissions: ["Dashboard", "Reports (view)", "Market prices"],
  },
];

const CATEGORY_OPTIONS = [
  "Getting Started",
  "Dashboard",
  "Farms",
  "Crops",
  "Sales & Finance",
  "Inventory",
  "Users & Permissions",
  "Billing & Payments",
  "Technical Issue",
  "Other",
];

interface SupportFormState {
  subject: string;
  category: string;
  description: string;
  priority: SupportPriority;
}

const EMPTY_FORM: SupportFormState = {
  subject: "",
  category: "",
  description: "",
  priority: "important",
};

function useAddSupportRequest() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: SupportRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      const supportActor = actor as unknown as SupportActor;
      return supportActor.addSupportRequest(request);
    },
  });
}

export function HelpSupportPage() {
  const addSupportRequest = useAddSupportRequest();

  const [query, setQuery] = useState("");
  const [form, setForm] = useState<SupportFormState>(EMPTY_FORM);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof SupportFormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    if (normalizedQuery === "") return HELP_ARTICLES;
    return HELP_ARTICLES.filter(
      (article) =>
        article.title.toLowerCase().includes(normalizedQuery) ||
        article.summary.toLowerCase().includes(normalizedQuery) ||
        article.section.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const sections = useMemo(() => {
    const order = [
      "Getting Started",
      "Understanding the Dashboard",
      "Module Help",
    ];
    return order
      .map((section) => ({
        section,
        articles: filteredArticles.filter((a) => a.section === section),
      }))
      .filter((group) => group.articles.length > 0);
  }, [filteredArticles]);

  const canSubmit =
    form.subject.trim() !== "" &&
    form.category !== "" &&
    form.description.trim() !== "" &&
    !addSupportRequest.isPending;

  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files)
      .map((file) => {
        // Prepare the file through object-storage so it is uploaded with its
        // content type and original filename preserved. The backend stores
        // attachment references as text, so we keep the filename as the
        // reference shown to the user and the support team.
        void file.arrayBuffer().then((buffer) => {
          ExternalBlob.fromBytes(new Uint8Array(buffer), file.type, file.name);
        });
        return file.name;
      })
      .filter((name) => !attachments.includes(name));
    setAttachments((current) => [...current, ...names]);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: SupportRequest = {
      id: 0n,
      subject: form.subject.trim(),
      category: form.category,
      description: form.description.trim(),
      priority: form.priority,
      attachments,
      status: "open",
      createdAt: BigInt(Date.now()) * 1_000_000n,
    };
    setForm(EMPTY_FORM);
    setAttachments([]);
    setFormError(null);
    addSupportRequest.mutate(payload, {
      onSuccess: () => setSubmitted(true),
      onError: (err) => {
        setFormError(err.message);
        setForm((current) =>
          current.subject === "" && current.description === ""
            ? payload
            : current,
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Help & Support"
        description="Find guides, documentation, and contact the AgriVision Pro support team."
      />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-ocid="help.search_input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles, guides, and FAQs…"
          className="h-11 pl-9"
          aria-label="Search help content"
        />
      </div>

      {/* Help articles */}
      <div className="flex flex-col gap-6">
        {sections.map((group) => (
          <section
            key={group.section}
            data-ocid={`help.section.${group.section}`}
          >
            <h2 className="font-display text-lg font-bold text-foreground">
              {group.section}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.articles.map((article) => (
                <Card
                  key={article.id}
                  data-ocid={`help.article.${article.id}`}
                  className="transition-smooth hover:shadow-elevated"
                >
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <article.icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <CardDescription>{article.summary}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {sections.length === 0 ? (
          <div
            data-ocid="help.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center"
          >
            <HelpCircle className="size-10 text-muted-foreground" />
            <p className="font-display text-base font-semibold text-foreground">
              No help articles found
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term, or submit a support request and our
              team will help you directly.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Support request form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-primary" />
              Submit a New Support Request
            </CardTitle>
            <CardDescription>
              Describe your issue and our support team will get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div
                data-ocid="help.success_state"
                className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-6 py-10 text-center"
              >
                <CheckCircle2 className="size-10 text-success" />
                <p className="font-display text-base font-semibold text-foreground">
                  Request submitted
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Thank you. Your support request has been received and our team
                  will respond shortly.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="help.submit_another_button"
                  onClick={() => setSubmitted(false)}
                >
                  Submit another request
                </Button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    data-ocid="help.input.subject"
                    value={form.subject}
                    onChange={(e) => set("subject")(e.target.value)}
                    placeholder="Brief summary of your issue"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="support-category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) => set("category")(value)}
                    >
                      <SelectTrigger
                        id="support-category"
                        data-ocid="help.select.category"
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="support-priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) =>
                        set("priority")(value as SupportPriority)
                      }
                    >
                      <SelectTrigger
                        id="support-priority"
                        data-ocid="help.select.priority"
                      >
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="support-description">Description</Label>
                  <Textarea
                    id="support-description"
                    data-ocid="help.textarea.description"
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                    placeholder="Provide as much detail as possible so we can help you quickly."
                    rows={5}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Attachments</Label>
                  <label
                    data-ocid="help.upload_button"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-6 text-center transition-smooth hover:border-primary hover:bg-muted/50"
                  >
                    <Upload className="size-6 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Click to attach files
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Documents, images, or screenshots
                    </span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        handleAddFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {attachments.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {attachments.map((name) => (
                        <li
                          key={name}
                          data-ocid="help.attachment_item"
                          className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                            <Paperclip className="size-4 shrink-0 text-primary" />
                            <span className="truncate">{name}</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-ocid="help.remove_attachment_button"
                            aria-label={`Remove ${name}`}
                            onClick={() =>
                              setAttachments((current) =>
                                current.filter((n) => n !== name),
                              )
                            }
                          >
                            <X className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {formError ? (
                  <p
                    data-ocid="help.form_error"
                    className="text-sm font-medium text-destructive"
                  >
                    {formError}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="submit"
                    data-ocid="help.submit_button"
                    disabled={!canSubmit}
                  >
                    <Send className="size-4" />
                    {addSupportRequest.isPending
                      ? "Submitting…"
                      : "Submit Request"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* System status */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    All Systems Operational
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last checked just now
                  </p>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Core platform</span>
                  <Badge className="bg-success/15 text-success">
                    Operational
                  </Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data storage</span>
                  <Badge className="bg-success/15 text-success">
                    Operational
                  </Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Market feed</span>
                  <Badge className="bg-success/15 text-success">
                    Operational
                  </Badge>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    data-ocid={`help.faq.${index + 1}`}
                  >
                    <AccordionTrigger className="text-left text-sm font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User roles & permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            User Roles & Permissions
          </CardTitle>
          <CardDescription>
            Understand what each role can access across AgriVision Pro.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table
            data-ocid="help.roles_table"
            className="w-full min-w-[640px] border-collapse text-sm"
          >
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2.5 font-semibold text-foreground">
                  Role
                </th>
                <th className="px-3 py-2.5 font-semibold text-foreground">
                  Description
                </th>
                <th className="px-3 py-2.5 font-semibold text-foreground">
                  Permissions
                </th>
              </tr>
            </thead>
            <tbody>
              {ROLE_ROWS.map((row, index) => (
                <tr
                  key={row.role}
                  data-ocid={`help.role_row.${index + 1}`}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-3 align-top font-medium text-foreground">
                    {row.role}
                  </td>
                  <td className="px-3 py-3 align-top text-muted-foreground">
                    {row.description}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {row.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
