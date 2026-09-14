import { HelpSupportPage } from "@/pages/HelpSupportPage";
import { createMockActor } from "@/test/mocks";
import { mockUseActor, renderWithClient } from "@/test/render";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The Radix Select dropdown does not open reliably in jsdom, so mock the
// select primitives with a native <select> (same mock as HelpSupportPage.test).
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

describe("HelpSupportPage category select", () => {
  it("renders every category as a selectable option", () => {
    const actor = createMockActor();
    mockUseActor(actor);
    renderWithClient(<HelpSupportPage />);

    const categorySelect = screen.getByTestId("help.select.category");
    const options = Array.from(categorySelect.querySelectorAll("option")).map(
      (o) => o.textContent,
    );

    expect(options).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });
});
