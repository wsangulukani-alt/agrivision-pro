import { HelpSupportPage } from "@/pages/HelpSupportPage";
import { createMockActor } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// The Radix Select dropdown does not open reliably in jsdom, so mock the
// select primitives with a native <select>. This keeps the support-request
// submission journey deterministic while still exercising the page's own
// form state and the actor call.
vi.mock("@/components/ui/select", () => {
  const React = require("react");

  interface SelectChildProps {
    value?: string;
    children?: React.ReactNode;
    id?: string;
    "data-ocid"?: string;
  }

  function findTriggerProps(
    children: React.ReactNode,
  ): Record<string, unknown> {
    let props: Record<string, unknown> = {};
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const childProps = child.props as SelectChildProps;
      if (childProps && (childProps.id || childProps["data-ocid"])) {
        props = { ...childProps };
      }
      if (childProps?.children) {
        props = { ...props, ...findTriggerProps(childProps.children) };
      }
    });
    return props;
  }

  function collectOptions(
    children: React.ReactNode,
  ): Array<{ value: string; label: React.ReactNode }> {
    const options: Array<{ value: string; label: React.ReactNode }> = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const childProps = child.props as SelectChildProps;
      if (childProps && typeof childProps.value === "string") {
        options.push({
          value: childProps.value,
          label: childProps.children as React.ReactNode,
        });
      }
      if (childProps?.children) {
        options.push(...collectOptions(childProps.children));
      }
    });
    return options;
  }

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (value: string) => void;
      children: React.ReactNode;
    }) => {
      const triggerProps = findTriggerProps(children);
      const options = collectOptions(children);
      return (
        <select
          id={triggerProps.id as string | undefined}
          data-ocid={triggerProps["data-ocid"] as string | undefined}
          value={value ?? ""}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onValueChange?.(e.target.value)
          }
        >
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    },
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{placeholder}</span>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => <option value={value}>{children}</option>,
  };
});

describe("HelpSupportPage", () => {
  it("renders help sections, FAQ, and the roles table", () => {
    const actor = createMockActor();
    mockUseActor(actor);
    renderWithClient(<HelpSupportPage />);

    expect(screen.getByText("Help & Support")).toBeInTheDocument();
    // "Getting Started" appears both as a section heading and as a select option.
    expect(screen.getAllByText("Getting Started").length).toBeGreaterThan(0);
    expect(screen.getByText("Understanding the Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Module Help")).toBeInTheDocument();

    // FAQ
    expect(
      screen.getByText("How do I add a new farm to the system?"),
    ).toBeInTheDocument();

    // Roles table
    expect(screen.getByText("User Roles & Permissions")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Field Officer")).toBeInTheDocument();
  });

  it("filters help articles by search query", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    mockUseActor(actor);
    renderWithClient(<HelpSupportPage />);

    await user.type(screen.getByLabelText("Search help content"), "dashboard");

    await waitFor(() => {
      expect(
        screen.getByText("Reading your dashboard KPIs"),
      ).toBeInTheDocument();
    });
    // An unrelated article is filtered out.
    expect(
      screen.queryByText("Create your first farm record"),
    ).not.toBeInTheDocument();
  });

  it("submits a support request through the form", async () => {
    const user = userEvent.setup();
    const actor = createMockActor();
    actor.addSupportRequest.mockResolvedValue(1n);
    mockUseActor(actor);
    renderWithClient(<HelpSupportPage />);

    await user.type(screen.getByLabelText("Subject"), "Cannot log a sale");
    await user.type(
      screen.getByLabelText("Description"),
      "The sales form does not accept my quantity.",
    );

    // Select a category from the (mocked) native select.
    await user.selectOptions(
      screen.getByLabelText("Category"),
      "Sales & Finance",
    );

    await user.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => {
      expect(actor.addSupportRequest).toHaveBeenCalledTimes(1);
    });
    expect(actor.addSupportRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Cannot log a sale",
        description: "The sales form does not accept my quantity.",
        category: "Sales & Finance",
      }),
    );
  });
});
